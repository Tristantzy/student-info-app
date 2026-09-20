document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
}

/* ---------- Helpers ---------- */

function getStudents() {
    try {
        return JSON.parse(localStorage.getItem('students')) || [];
    } catch (e) {
        return [];
    }
}

function saveStudents(students) {
    localStorage.setItem('students', JSON.stringify(students));
}

// Escape user text before putting it into HTML
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// "Juan Dela Cruz" -> "JC"
function getInitials(name) {
    var parts = String(name).trim().split(/\s+/);
    var first = parts[0] ? parts[0].charAt(0) : '';
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
}

// "2nd Year" -> 2 (0 if it is not one of the four choices)
function getYearNumber(yearLevel) {
    var n = parseInt(String(yearLevel).charAt(0), 10);
    return (n >= 1 && n <= 4) ? n : 0;
}

/* ---------- Toast messages ---------- */

var toastTimer = null;

function showToast(text, type) {
    var toast = document.getElementById('toast');
    toast.textContent = text;
    toast.className = 'toast show ' + (type || 'success');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
        toast.className = 'toast';
    }, 2500);
}

/* ---------- Navigation ---------- */

var navItems = document.querySelectorAll('.nav-item');

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(function (page) {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    navItems.forEach(function (item) {
        item.classList.toggle('active', item.getAttribute('data-page') === pageId);
    });

    if (pageId === 'homePage') {
        updateHomeStats();
    }

    if (pageId === 'profilePage') {
        loadProfile();
    }

    window.scrollTo(0, 0);
}

function exitApp() {
    if (navigator.app) {
        navigator.app.exitApp();
    } else if (navigator.device) {
        navigator.device.exitApp();
    }
}

function updateHomeStats() {
    var count = getStudents().length;
    document.getElementById('homeCount').textContent =
        count + (count === 1 ? ' student registered' : ' students registered');
}

/* ---------- Dark Mode ---------- */

var darkModeBtn = document.getElementById('darkModeBtn');

if (localStorage.getItem('darkMode') === 'on') {
    document.body.classList.add('dark-mode');
    darkModeBtn.textContent = 'Light Mode';
}

darkModeBtn.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'on');
        darkModeBtn.textContent = 'Light Mode';
    } else {
        localStorage.setItem('darkMode', 'off');
        darkModeBtn.textContent = 'Dark Mode';
    }
});

/* ---------- Registration form ---------- */

var studentForm = document.getElementById('studentForm');
var nameInput = document.getElementById('studentName');
var idInput = document.getElementById('studentID');
var courseSelect = document.getElementById('course');
var otherCourseInput = document.getElementById('otherCourse');
var emailInput = document.getElementById('email');
var contactInput = document.getElementById('contact');
var yearOptions = document.getElementById('yearOptions');
var yearChips = document.querySelectorAll('.year-chip');

// Red border helpers
function clearInvalid() {
    document.querySelectorAll('.invalid').forEach(function (el) {
        el.classList.remove('invalid');
    });
}

function markInvalid(element, text) {
    element.classList.add('invalid');
    showToast(text, 'error');
}

// Remove the red border as soon as the user fixes the field
studentForm.addEventListener('input', function (event) {
    event.target.classList.remove('invalid');
});
studentForm.addEventListener('change', function (event) {
    event.target.classList.remove('invalid');
});

// Year level choices
function setYearLevel(value) {
    document.getElementById('yearLevel').value = value;
    document.getElementById('selectedYear').textContent = value === '' ? '-' : value;
    yearOptions.classList.remove('invalid');
    yearChips.forEach(function (chip) {
        chip.classList.toggle('selected', chip.getAttribute('data-year') === value);
    });
}

yearChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
        setYearLevel(chip.getAttribute('data-year'));
    });
});

// Course dropdown (with an "Other" option that shows a text box)
function toggleOtherCourse() {
    if (courseSelect.value === 'Other') {
        otherCourseInput.classList.remove('hidden');
    } else {
        otherCourseInput.classList.add('hidden');
    }
}

courseSelect.addEventListener('change', toggleOtherCourse);

function setCourse(value) {
    var isKnown = false;

    for (var i = 0; i < courseSelect.options.length; i++) {
        var optionValue = courseSelect.options[i].value;
        if (optionValue === value && value !== '' && value !== 'Other') {
            isKnown = true;
        }
    }

    if (value === '') {
        courseSelect.value = '';
        otherCourseInput.value = '';
    } else if (isKnown) {
        courseSelect.value = value;
        otherCourseInput.value = '';
    } else {
        // Older records with a typed course go under "Other"
        courseSelect.value = 'Other';
        otherCourseInput.value = value;
    }

    toggleOtherCourse();
}

// Put the form back to a clean "new student" state
function resetForm() {
    studentForm.reset();
    document.getElementById('editIndex').value = '';
    setYearLevel('');
    setCourse('');
    clearInvalid();
    document.getElementById('formTitle').textContent = 'Student Registration';
    document.getElementById('submitBtn').textContent = 'Register';
}

function openRegister() {
    resetForm();
    showPage('registerPage');
}

// Registration, validation, multiple students in localStorage
studentForm.addEventListener('submit', function (event) {
    event.preventDefault();
    clearInvalid();

    var name = nameInput.value.trim();
    var studentID = idInput.value.trim();
    var courseChoice = courseSelect.value;
    var course = courseChoice === 'Other' ? otherCourseInput.value.trim() : courseChoice;
    var yearLevel = document.getElementById('yearLevel').value;
    var email = emailInput.value.trim();
    var contact = contactInput.value.trim();
    var editIndex = document.getElementById('editIndex').value;

    // 1. Empty fields: highlight all of them at once
    var hasEmpty = false;

    function requireField(element, value) {
        if (value === '') {
            element.classList.add('invalid');
            hasEmpty = true;
        }
    }

    requireField(nameInput, name);
    requireField(idInput, studentID);
    if (courseChoice === '') {
        requireField(courseSelect, '');
    } else if (courseChoice === 'Other') {
        requireField(otherCourseInput, course);
    }
    requireField(yearOptions, yearLevel);
    requireField(emailInput, email);
    requireField(contactInput, contact);

    if (hasEmpty) {
        showToast('Please complete all fields.', 'error');
        return;
    }

    // 2. Format checks
    var namePattern = /^[A-Za-z\s]+$/;
    if (!namePattern.test(name)) {
        markInvalid(nameInput, 'Name should only contain letters.');
        return;
    }

    var studentIDPattern = /^[A-Za-z0-9\-]+$/;
    if (!studentIDPattern.test(studentID)) {
        markInvalid(idInput, 'Please enter a valid Student ID.');
        return;
    }

    var coursePattern = /^(?=.*[A-Za-z])[A-Za-z0-9\s]+$/;
    if (!coursePattern.test(course)) {
        markInvalid(courseChoice === 'Other' ? otherCourseInput : courseSelect, 'Please enter a valid Course.');
        return;
    }

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        markInvalid(emailInput, 'Please enter a valid email address.');
        return;
    }

    var contactPattern = /^[0-9]{7,15}$/;
    if (!contactPattern.test(contact)) {
        markInvalid(contactInput, 'Please enter a valid contact number.');
        return;
    }

    // 3. Duplicate Student ID (the record being edited doesn't count)
    var students = getStudents();
    var isDuplicate = students.some(function (s, i) {
        return s.studentID.toLowerCase() === studentID.toLowerCase() && String(i) !== editIndex;
    });
    if (isDuplicate) {
        markInvalid(idInput, 'That Student ID is already registered.');
        return;
    }

    var student = {
        name: name,
        studentID: studentID,
        course: course,
        yearLevel: yearLevel,
        email: email,
        contact: contact
    };

    var wasEdit = editIndex !== '';

    if (wasEdit) {
        students[parseInt(editIndex, 10)] = student;
    } else {
        students.push(student);
    }

    saveStudents(students);
    resetForm();
    updateHomeStats();

    if (wasEdit) {
        showToast('Profile updated successfully!', 'success');
        showPage('profilePage');
    } else {
        showToast('Registration successful!', 'success');
    }
});

/* ---------- Profile list: search, filter, sort ---------- */

var searchInput = document.getElementById('searchInput');
var sortSelect = document.getElementById('sortSelect');
var filterChips = document.querySelectorAll('.filter-chip');
var yearFilter = 'All';

searchInput.addEventListener('input', loadProfile);
sortSelect.addEventListener('change', loadProfile);

filterChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
        yearFilter = chip.getAttribute('data-year');
        filterChips.forEach(function (c) {
            c.classList.toggle('selected', c === chip);
        });
        loadProfile();
    });
});

function loadProfile() {
    var profileData = document.getElementById('profileData');
    var countText = document.getElementById('studentCount');
    var students = getStudents();

    if (students.length === 0) {
        countText.textContent = '';
        profileData.innerHTML = '<p>No students registered yet. Tap Register to add one.</p>';
        return;
    }

    var query = searchInput.value.trim().toLowerCase();
    var sortBy = sortSelect.value;

    // Keep each student's original index so Edit / Delete hit the right record
    var items = students.map(function (student, index) {
        return { student: student, index: index };
    });

    items = items.filter(function (item) {
        var s = item.student;
        var matchesYear = yearFilter === 'All' || s.yearLevel === yearFilter;
        var text = (s.name + ' ' + s.studentID + ' ' + s.course).toLowerCase();
        return matchesYear && (query === '' || text.indexOf(query) !== -1);
    });

    items.sort(function (a, b) {
        if (sortBy === 'newest') {
            return b.index - a.index;
        }

        if (sortBy === 'year') {
            var ya = getYearNumber(a.student.yearLevel) || 9;
            var yb = getYearNumber(b.student.yearLevel) || 9;
            if (ya !== yb) {
                return ya - yb;
            }
        }

        var na = a.student.name.toLowerCase();
        var nb = b.student.name.toLowerCase();
        if (na < nb) {
            return sortBy === 'name-desc' ? 1 : -1;
        }
        if (na > nb) {
            return sortBy === 'name-desc' ? -1 : 1;
        }
        return 0;
    });

    countText.textContent = 'Showing ' + items.length + ' of ' + students.length +
        (students.length === 1 ? ' student' : ' students');

    if (items.length === 0) {
        profileData.innerHTML = '<p>No students match your search.</p>';
        return;
    }

    var html = '';
    items.forEach(function (item) {
        var s = item.student;
        var yearNumber = getYearNumber(s.yearLevel);
        var badgeClass = 'badge badge-' + (yearNumber || 'other');

        html +=
            '<div class="student-card">' +
                '<div class="card-header">' +
                    '<div class="avatar">' + escapeHtml(getInitials(s.name)) + '</div>' +
                    '<div class="card-title">' +
                        '<span class="card-name">' + escapeHtml(s.name) + '</span>' +
                        '<span class="card-id">' + escapeHtml(s.studentID) + '</span>' +
                    '</div>' +
                    '<span class="' + badgeClass + '">' + escapeHtml(s.yearLevel) + '</span>' +
                '</div>' +
                '<p><strong>Course:</strong> ' + escapeHtml(s.course) + '</p>' +
                '<p><strong>Email:</strong> ' + escapeHtml(s.email) + '</p>' +
                '<p><strong>Contact:</strong> ' + escapeHtml(s.contact) + '</p>' +
                '<div class="card-buttons">' +
                    '<button type="button" onclick="editStudent(' + item.index + ')">Edit</button>' +
                    '<button type="button" class="btn-delete" onclick="deleteStudent(' + item.index + ')">Delete</button>' +
                '</div>' +
            '</div>';
    });

    profileData.innerHTML = html;
}

// Load a student's data into the form for editing
function editStudent(index) {
    var students = getStudents();
    var student = students[index];

    resetForm();

    nameInput.value = student.name;
    idInput.value = student.studentID;
    setCourse(student.course);
    setYearLevel(student.yearLevel);
    emailInput.value = student.email;
    contactInput.value = student.contact;
    document.getElementById('editIndex').value = index;

    document.getElementById('formTitle').textContent = 'Edit Student';
    document.getElementById('submitBtn').textContent = 'Update';

    showPage('registerPage');
}

// Delete one student record (asks first)
function deleteStudent(index) {
    if (!confirm('Delete this student record?')) {
        return;
    }

    var students = getStudents();
    students.splice(index, 1);
    saveStudents(students);
    updateHomeStats();
    loadProfile();
    showToast('Student deleted.', 'success');
}

// First load
updateHomeStats();
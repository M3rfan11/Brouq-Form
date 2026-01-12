const API_BASE_URL = window.location.origin;

// Validation functions
const validators = {
    name: (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return 'Full name is required';
        }
        if (trimmed.length < 3) {
            return 'Name must be at least 3 characters long';
        }
        if (trimmed.length > 100) {
            return 'Name must be less than 100 characters';
        }
        if (!/^[a-zA-Z\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+$/.test(trimmed)) {
            return 'Name can only contain letters and spaces';
        }
        return '';
    },
    
    email: (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return 'Email address is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            return 'Please enter a valid email address';
        }
        if (trimmed.length > 255) {
            return 'Email address is too long';
        }
        return '';
    },
    
    phone: (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return ''; // Phone is optional
        }
        // Remove spaces, dashes, and plus signs for validation
        const cleaned = trimmed.replace(/[\s\-+]/g, '');
        // Egyptian phone number: 10 digits (01xxxxxxxx) or 11 digits (010xxxxxxxx)
        // Or international format starting with +20
        if (!/^(\+?20)?1[0-2,5]\d{8}$/.test(cleaned) && !/^01[0-2,5]\d{8}$/.test(cleaned)) {
            return 'Please enter a valid Egyptian phone number (e.g., 01012345678)';
        }
        return '';
    }
};

// Validate a single field
function validateField(fieldName, value) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const inputElement = document.getElementById(fieldName);
    const error = validators[fieldName](value);
    
    if (error) {
        errorElement.textContent = error;
        errorElement.style.display = 'block';
        inputElement.classList.add('error');
        return false;
    } else {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        inputElement.classList.remove('error');
        return true;
    }
}

// Validate entire form
function validateForm() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    
    const isNameValid = validateField('name', name);
    const isEmailValid = validateField('email', email);
    const isPhoneValid = validateField('phone', phone);
    
    return isNameValid && isEmailValid && isPhoneValid;
}

// Add real-time validation
document.getElementById('name').addEventListener('blur', function() {
    validateField('name', this.value);
});

document.getElementById('name').addEventListener('input', function() {
    if (this.classList.contains('error')) {
        validateField('name', this.value);
    }
});

document.getElementById('email').addEventListener('blur', function() {
    validateField('email', this.value);
});

document.getElementById('email').addEventListener('input', function() {
    if (this.classList.contains('error')) {
        validateField('email', this.value);
    }
});

document.getElementById('phone').addEventListener('blur', function() {
    validateField('phone', this.value);
});

document.getElementById('phone').addEventListener('input', function() {
    if (this.classList.contains('error')) {
        validateField('phone', this.value);
    }
});

// Form submission
document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const messageDiv = document.getElementById('message');
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };

    // Disable button and show loading
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';

    // Hide previous messages
    messageDiv.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/api/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Success - hide form and show only success message
            document.getElementById('attendanceForm').style.display = 'none';
            document.querySelector('.header').style.display = 'none';
            messageDiv.className = 'message success';
            messageDiv.textContent = data.message || 'Registration successful! Check your email for the QR code.';
            messageDiv.style.display = 'block';
        } else {
            // Error
            messageDiv.className = 'message error';
            messageDiv.textContent = data.error || 'Failed to submit form. Please try again.';
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Network error. Please check your connection and try again.';
        messageDiv.style.display = 'block';
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
});

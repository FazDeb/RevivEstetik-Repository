document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('contactForm');
    var feedback = document.getElementById('feedback');

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the default form submission

            var name = encodeURIComponent(document.getElementById('name').value);
            var email = encodeURIComponent(document.getElementById('email').value);
            var number = encodeURIComponent(document.getElementById('number').value);
            var message = encodeURIComponent(document.getElementById('message').value);

            var numberField = document.getElementById('number');
            if (numberField.value.trim() === '' || !/^\d+$/.test(numberField.value)) {
                alert('Please enter a valid contact number.');
                return; // Prevent the form from being submitted
            }

            var mailtoLink = `mailto:alexanderdebono13@gmail.com?subject=New Contact Form Submission&body=Name: ${name}%0AEmail: ${email}%0APhone: ${number}%0A%0AMessage:%0A${message}`;

            // Open the user's email client with the pre-filled message
            window.location.href = mailtoLink;

            // Provide feedback to the user
            if (feedback) {
                feedback.textContent = "Please check your email client and finalize the email.";
            }
        });
    }

    // Select all interactive divs using class selector
    var interactiveDivs = document.querySelectorAll('.interactive-div');

    // Function to determine if the screen is mobile size
    function isMobile() {
        return window.matchMedia("(max-width: 600px)").matches;
    }

    // Iterate through each interactive div
    interactiveDivs.forEach(function(div) {
        div.addEventListener('click', function() {
            var moreText = div.querySelector('.more-text');
            
            if (moreText) {
                moreText.classList.toggle('expanded');
    
                if (moreText.classList.contains('expanded')) {
                    div.style.height = 'auto';
                } else {
                    if (isMobile()) {
                        div.style.height = '150px'; // Adjust height for mobile view
                    } else {
                        div.style.height = '80px'; // Default height for desktop view
                    }
                }
            }
        });
    });
    
});

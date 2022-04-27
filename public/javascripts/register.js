const registerFormEl = document.getElementById('register_form');
if (registerFormEl)
    registerFormEl.addEventListener('submit', function (e) {
        e.preventDefault();
        const password_field = document.getElementById('password');
        const confirm_field = document.getElementById('confirm_password');
        if (password_field.value != confirm_field.value) {
            document.getElementById('password_alert').hidden = false;
            return;
        }
        const formData = new FormData(e.target);
        const bodyData = new URLSearchParams(formData);
        fetch("/auth/register", { method: 'POST', body: bodyData })
            .then(x => x.json())
            .then(regResult => {
                    if (regResult.error) {
                        document.location = '?error='.concat(regResult.error);
                        return;
                    }
                    window.location = '/auth/login';
            })
            .catch((err) => {
                console.log(err);
                document.location = '?error=serverError';
            });
    });
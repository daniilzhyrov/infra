const loginFormEl = document.getElementById('login_form');

if (loginFormEl)
    loginFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const bodyData = new URLSearchParams(formData);
            const scripts = document.getElementsByTagName('script');
            const script = scripts[scripts.length - 1];
            const response = await fetch("/auth/login", { method: 'POST', body: bodyData });
            const authResult = await response.json();
            if (authResult.error) {
                document.location = '?error='.concat(authResult.error);
                return;
            }
            localStorage.setItem("jwt", authResult.token);
            window.location = script.getAttribute('redirect') ? script.getAttribute('redirect') : '/';
        } catch(err) {
            console.log(err);
            document.location = '?error=serverError';
        }
    });

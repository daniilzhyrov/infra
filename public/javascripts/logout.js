const button = document.getElementById('logout_button');
if (button != undefined)
    button.addEventListener('click', async () => {
        try {
            localStorage.removeItem('jwt');
            await fetch("/auth/logout", { method: 'POST'});
            document.location = '/';
        } catch (err) {
            console.log(err);
            alert('Server error occured');
        }
    });
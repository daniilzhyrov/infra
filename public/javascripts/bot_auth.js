const submitButton = document.getElementById('submit');
const container = document.getElementById('main_container');


const jwt = localStorage.getItem('jwt');
if (!jwt) {
    document.location = '/auth/login?info=mustLogin&redirect=' + document.location;
}

const scripts = document.getElementsByTagName('script');
const script = scripts[scripts.length - 1];

let body = new URLSearchParams();
body.append('telegramId',  script.getAttribute('telegram_id'));

const reqOptions = {
    headers: { Authorization: `Bearer ${jwt}`, },
    method : 'PUT',
    body : body
};

const user_id = script.getAttribute('user_id');
if (submitButton)
    submitButton.onclick = async () => {
        const response = await fetch ("/api/v1/users/" + user_id, reqOptions);
        if (response.status == 401) {
            document.location = '/auth/login?info=mustLogin&redirect=' + document.location;
            return;
        }
        if (response.status == 500) {
            container.innerHTML = 'Sth went wrong';
            return;
        }
        if (container)
            container.innerHTML = 'Successfully';
        setTimeout(() => {
            close();
        }, 888);
    }
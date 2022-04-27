let id, owner = false;

async function show_form() {
    try {
        const form = await fetch("/templates/confirmation_form.mst").then(x => x.text());
        let formElement = document.createElement("div");
        formElement.id = '_confirmation_form';
        const scripts = document.getElementsByTagName('script');
        const script = scripts[scripts.length - 1];
        id = script.getAttribute('id');
        if (script.getAttribute('owner'))
            owner = true;
        formElement.innerHTML = Mustache.render(form, {
            id : id
        });
        document.body.style.transition = 'all 400ms ease'
        document.body.style.opacity = 0.2;
        document.body.style["pointer-events"] = 'none';
        document.documentElement.appendChild(formElement);
    } catch(err) {
        console.error(err)
    }
}

function hide_form() {
    try {
        let formElement = document.getElementById("_confirmation_form");
        formElement.parentElement.removeChild(formElement);
        document.body.style.opacity = 1;
        document.body.style["pointer-events"] = 'auto';
    } catch(err) {
        console.log(err)
    }
}

async function confirm() {
    try {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
            document.location = '/auth/login?info=mustLogin&redirect=' + document.location;
            return;
        }
        const reqOptions = {
            method : 'DELETE',
            headers: { Authorization: `Bearer ${jwt}`, },
        };
        const response = await fetch("/api/v1/users/".concat(id), reqOptions);
        if (response.status == 401) {
            document.location = '/auth/login?info=mustLogin&redirect=' + document.location;
            return;
        }
        if (owner)
            document.location = '/';
        else
            document.location = '/users';
    } catch(err) {
        console.log(err)
    }
}


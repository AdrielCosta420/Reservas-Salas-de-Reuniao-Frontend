async function login(email, password) {
    fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    }).then(response => {
        if (!response.ok) {
            throw new Error('Falha ao autenticar');
        }
  
  
        return response.json();
    }).then(data => {
        console.log('Token de autentificação: ', data.token);

        const user = data.user;

        console.log(user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('id', user.id);
        loadUser();

        window.location.href = 'meeting_rooms.html';
    }).catch(error => {
        console.error('Erro ao autenticar: ', error);
    })
}

function loadUser() {
    const devUser = document.querySelector('.user')
    const user = localStorage.getItem('user') != null ? JSON.parse(localStorage.getItem('user')) : {}
    // const userHTML = `<p>${user.name}</p>`
    // devUser.innerHTML = userHTML;
}

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log(email, password);
    login(email, password);
})



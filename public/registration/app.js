(function(){

const register_button = document.getElementById('register_button');
register_button.addEventListener('click', async () => {
    const name = document.getElementById('name').value;
    if (!name) {
	return;
    }
    const user = { name };

    const response = await fetch('/register-user', {
	method: 'POST',
	headers: {
	    'Content-Type': 'application/json'
	},
	body: JSON.stringify(user)
    });

    if (!response.ok) {
        console.log('registration failed');
    }

    window.location.assign('/quiz');
});

})();
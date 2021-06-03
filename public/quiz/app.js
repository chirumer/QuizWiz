(async function(){

const question_ele = document.getElementById('question');
const timer_count_ele = document.getElementById('timer_count');
const options_area_ele = document.getElementById('options_area');

const submit_button = document.getElementById('submit_button');
submit_button.addEventListener('click', () => {
   // submit the question 
});

await load_question();

async function load_question() {
    const response = await fetch('/get-question');
    if (!response.ok) {
        console.log('failed to get question');
        throw new Error();
    }
    const data = await response.json();

    if (data.is_over) {
        window.location.assign('/results');
    }

    question_ele.textContent = data.question;
    timer_count_ele.textContent = 'undefined'; // implement later

    options_area_ele.textContent = '';
    const options_list_ele = document.createElement('ul');
    options_area_ele.appendChild(options_list_ele);

    data.options.forEach((option, index) => {
        const option_ele = document.createElement('li');
        options_list_ele.appendChild(option_ele);

        const button = document.createElement('input');
        button.setAttribute('type', 'radio');
        button.setAttribute('id', `option_${index}`);
        button.setAttribute('name', 'option');
        options_list_ele.appendChild(button);

        const label = document.createElement('label');
        label.setAttribute('for', `option_${index}`);
        label.textContent = option;
        options_list_ele.appendChild(label);
    });
}

})();
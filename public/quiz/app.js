(async function(){

let question_no = -1;
let timer_ID;

const question_ele = document.getElementById('question');
const timer_count_ele = document.getElementById('timer_count');
const options_area_ele = document.getElementById('options_area');

const submit_button = document.getElementById('submit_button');
submit_button.addEventListener('click', async () => {
    clearInterval(timer_ID);

    const options_list = document.getElementById('options_list');

    let radio_btns = [];
    for (i of options_list.children) {
        if (i instanceof HTMLInputElement) {
            radio_btns.push(i);
        }
    }
    let selected_answer = -1;
    for (btn_index in radio_btns) {
        if (radio_btns[btn_index].checked) {
            selected_answer = +btn_index;
            break;
        }
    }
    if (selected_answer == -1) {
        return;
    }
    
    const response = await fetch('/submit-answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answer: selected_answer, question_no })
    });

    if (!response.ok) {
        console.log('could not submit answer');
    }

    const data = await response.json();

    if (data.lost_sync) {
	console.log('question was out of sync');
    }
    else if (data.is_timeout) {
        alert('this question marked as timed out');
    }
    await load_question();
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
        return;
    }
    question_no = data.question_no

    question_ele.textContent = `(${question_no+1}): ` + data.question;
    timer_count_ele.textContent = 'undefined'; // implement later

    options_area_ele.textContent = '';
    const options_list_ele = document.createElement('ul');
    options_area_ele.appendChild(options_list_ele);
    options_list_ele.setAttribute('id', 'options_list')

    data.options.forEach((option, index) => {
        const option_ele = document.createElement('li');
        options_list_ele.appendChild(option_ele);

        const button = document.createElement('input');
        options_list_ele.appendChild(button);
        button.setAttribute('type', 'radio');
        button.setAttribute('id', `option_${index}`);
        button.setAttribute('name', 'option');

        const label = document.createElement('label');
        options_list_ele.appendChild(label);
        label.setAttribute('for', `option_${index}`);
        label.textContent = option;
    });

    let time_left = Math.round(data.time_left / 1000);
    time_left = time_left > 0 ? time_left : 0;

    timer_count_ele.innerText = time_left;
    if (time_left) {
	--time_left;

	timer_ID = window.setInterval(() => {
	    timer_count_ele.innerText = time_left;
	    if (!time_left) {
		clearInterval(timer_ID);
	    }
	    --time_left;
	}, 950);
    }
}

})();

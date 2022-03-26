document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emailS-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  const maindiv = document.getElementById('emailS-view');

  // Show the mailbox and hide other views
  document.querySelector('#emailS-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  maindiv.innerHTML = `<h3 id="title">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      console.log(emails);

      // Adds a container with a blue colored border for the emails.
      let contain = document.createElement('div');
      contain.className = 'card border-primary';
      maindiv.appendChild(contain);

      if (emails.length === 0) {
        contain.innerHTML = '<h2 style="text-align: center;">Nothing to show here for now</h2>';
      }
      else {
        for (i in emails) {
        
          // Creates a div for each email and triggers the 'load_mail' function when an email is clicked.
          // https://stackoverflow.com/questions/13391064/wrong-parameter-is-passed-to-function this post has an answer (green ticked) that explains this part of the funcion very well.
          var container = document.createElement('div');
          (function(i){
            container.addEventListener('click', () => load_mail(emails[i]['id'], mailbox));
          })(i);

          if (emails[i]['read'] === false) {
            container.classList.add('row', 'unread');
          }
          else {
            container.classList.add('row', 'read');
          }
          container.innerHTML = `
            <div class="col">${emails[i]['sender']}</div>
            <div class="col">${emails[i]['subject']}</div>
            <div class="col">${emails[i]['timestamp']}</div>
          `;
          contain.appendChild(container);

        }
      }
  })
}

function load_mail(id, title) {

  console.log(`email clicked (id: ${id})`);
  document.querySelector('#emailS-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  const eView = document.getElementById('email-view');

  // Reset email-view because the emails will stack if its not cleared.
  eView.innerHTML = '';

  // Mark the email as 'read' once it has been clicked.
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

  // Display email info.
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      console.log(email);

      let mailContainer = document.createElement('div');
      mailContainer.classList.add('card');
      mailContainer.innerHTML = `
        <ul class="list-group list-group-flush">
          <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
          <li class="list-group-item"><strong>Recipients:</strong> ${email.recipients}</li>
          <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
          <li class="list-group-item"><strong>Date sent:</strong> ${email.timestamp}</li>
          <li class="list-group-item">${email.body}</li>
        </ul>
        <br>
      `;

      // Adds a reply button with its own function.
      let rep = document.createElement('button');
      rep.innerHTML = 'Reply';
      rep.classList.add('form-control', 'btn', 'btn-secondary');
      rep.addEventListener('click', function() {
        compose_email()

        document.getElementById('compose-recipients').value = email.sender;
        let subj = email.subject;
        if (subj.split(' ', 1)[0] != 'Re:') {
          document.getElementById('compose-subject').value = `Re: ${subj}`;
        }
        else {
          document.getElementById('compose-subject').value = subj;
        }
        document.getElementById('compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: ${email.body}`
      });
      let s1 = document.createElement('p');
      mailContainer.append(s1);
      mailContainer.appendChild(rep);

      let s2 = document.createElement('p');
      mailContainer.append(s2);

      // Archive button only present if email is not clicked from the 'sent' section.
      console.log(`title: ${title}`);
      if (title != 'sent') {
        let arc = document.createElement('button');
        arc.classList.add('form-control', 'btn', 'btn-danger');

        // Check if email is already archived or not
        if (email.archived != true) {
          arc.innerHTML = 'Archive';
          arc.addEventListener('click', function() {
            fetch(`/emails/${id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: true
              })
            })
            localStorage.clear();
            load_mailbox('inbox');
            location.reload()
          });
        }
        else {
          arc.innerHTML = 'Unarchive';
          arc.addEventListener('click', function() {
            fetch(`/emails/${id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: false
              })
            })
            localStorage.clear();
            load_mailbox('inbox');
            location.reload()
          });
        }
        mailContainer.appendChild(arc);
      }

      let s3 = document.createElement('p');
      mailContainer.append(s3);

      eView.appendChild(mailContainer);
  });

}

function send_mail() {

  const receiver = document.querySelector('#compose-recipients').value;
  const title = document.querySelector('#compose-subject').value;
  const content = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: receiver,
        subject: title,
        body: content
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    load_mailbox('sent');
  });

}
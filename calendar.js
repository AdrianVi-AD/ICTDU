document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var modal = document.getElementById('eventModal');
    var span = document.getElementsByClassName('close')[0];

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: [
            {
                title: 'Research Colloquium',
                start: '2024-05-18',
                description: "Discover groundbreaking innovations and cutting-edge research that are shaping the future. Don't miss this opportunity to engage with leading experts and explore tomorrow's solutions today. See you there! #ResearchColloquium2024 #spcfccis #spcfictdu #InnovateWithAI.",
                registrationLink: 'https://example.com/register-js-basics'
            },
        ],
        eventClick: function(info) {
            document.getElementById('eventTitle').textContent = info.event.title;
            document.getElementById('eventDescription').textContent = info.event.extendedProps.description;
            document.getElementById('registrationLink').href = info.event.extendedProps.registrationLink;
            modal.style.display = 'block';
        }
    });

    calendar.render();

    // Close the modal when the user clicks on <span> (x)
    span.onclick = function() {
        modal.style.display = 'none';
    }

    // Close the modal when the user clicks anywhere outside of the modal
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
});  
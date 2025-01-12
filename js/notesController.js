var notesController = (function () {
	let _patient;

	init();

	function init() {
		document.getElementById('new-note').addEventListener('click', (event) => {
			document.getElementById('note-input-container').classList.toggle('show');
		});

		document.getElementById('note-input-container').addEventListener(
			'transitionend',
			function () {
				if (this.classList.contains('show')) {
					document.getElementById('note-text').focus();
				}
			},
			false
		);

		document.getElementById('save-note').addEventListener('click', (event) => {
			saveNote(document.getElementById('note-text').value);
		});

		document.getElementById('cancel-note').addEventListener('click', closeNoteInput);

		document.getElementById('note-input-container').addEventListener('input', (event) => {
			event.target.value = event.target.value.substring(0, 1000);
			updateInputCounter(event.target.value);
		});
	}

	function initPatient(patient) {
		_patient = patient;
		closeNoteInput();
		buildNotesDisplay(patient?.notes);
	}

	function saveNote(text) {
		const note = {
			date: new Date().getTime(),
			value: text ?? '',
		};
		if (note.value) {
			_patient.notes = [note, ...(_patient.notes || [])].slice(0, 10);
			patientService.saveData(_patient.mrn, _patient);
			buildNotesDisplay(_patient.notes, true);
			closeNoteInput();
		}
	}

	function closeNoteInput() {
		document.getElementById('note-text').value = '';
		updateInputCounter();
		document.getElementById('note-input-container').classList.remove('show');
	}

	function updateInputCounter(value) {
		document.getElementById('note-input-counter').innerHTML = `${value?.length || 0} / 1,000`;
	}

	function buildNotesDisplay(notes, isNewNote) {
		const noteElements = notes?.map((note, index) => {
			const noteDiv = document
				.querySelector('#note-item-template')
				.content.querySelector('.note')
				.cloneNode(true);

			if (isNewNote && index === 0) {
				highlightSave(noteDiv);
			}

			if (note.date) {
				const date = new Date(note.date);
				const hours = `0${date.getHours()}`.slice(-2);
				const minutes = `0${date.getMinutes()}`.slice(-2);

				noteDiv.querySelector('.date').innerHTML = `${date.toLocaleDateString()}<br>${hours}:${minutes}`;
			}

			noteDiv.querySelector('.note-text').innerHTML = note.value?.replaceAll('\n', '<br>');

			return noteDiv;
		});

		document.getElementById('note-list-container').replaceChildren(...(noteElements || []));
	}

	return { initPatient };
})();

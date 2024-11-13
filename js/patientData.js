const baseDate = new Date();
const dateMinusOne = new Date(baseDate).setDate(baseDate.getDate() - 1);
const dateMinusTwo = new Date(baseDate).setDate(baseDate.getDate() - 2);
const dateMinusThree = new Date(baseDate).setDate(baseDate.getDate() - 3);

const patientData = [
	{
		firstName: "Maureene",
		lastName: "Dulinty",
		mrn: "6947012287",
		gender: "Female",
		dateOfBirth: "5/1/1946",
		age: 78,
		vitalSigns: [
			{
				date: dateMinusOne,
				bp: {
					sys: 100,
					dia: 60,
				},
				temp: 90,
				pulse: 40,
				o2: 90,
				resp: 10,
				pain: 4,
				height: 60,
				weight: 150,
			},
			{
				date: dateMinusTwo,
				bp: {
					sys: 110,
					dia: 70,
				},
				temp: 93,
				pulse: 43,
				o2: 93,
				resp: 13,
				pain: 5,
				height: 61,
				weight: 155,
			},
			{
				date: dateMinusThree,
				bp: {
					sys: 120,
					dia: 80,
				},
				temp: 96,
				pulse: 46,
				o2: 96,
				resp: 16,
				pain: 6,
				height: 60,
				weight: 160,
			},
		],
	},
	{
		firstName: "Lindie",
		lastName: "Keepe",
		mrn: "0189267798",
		gender: "Female",
		dateOfBirth: "10/28/1933",
		age: 91,
	},
	{
		firstName: "Antonella",
		lastName: "McCurry",
		mrn: "8748056995",
		gender: "Male",
		dateOfBirth: "6/7/1949",
		age: 75,
	},
	{
		firstName: "Sayre",
		lastName: "Feaster",
		mrn: "9347946753",
		gender: "Male",
		dateOfBirth: "11/23/1936",
		age: 88,
	},
	{
		firstName: "Dina",
		lastName: "Lucas",
		mrn: "7208551979",
		gender: "Female",
		dateOfBirth: "11/6/1938",
		age: 86,
	},
	{
		firstName: "Conn",
		lastName: "Sheal",
		mrn: "4611028917",
		gender: "Male",
		dateOfBirth: "9/19/1934",
		age: 90,
	},
	{
		firstName: "Blakeley",
		lastName: "Gurney",
		mrn: "2385707373",
		gender: "Female",
		dateOfBirth: "9/22/1931",
		age: 93,
	},
	{
		firstName: "Sharla",
		lastName: "Dashwood",
		mrn: "1567391443",
		gender: "Female",
		dateOfBirth: "1/22/1958",
		age: 66,
	},
	{
		firstName: "Derk",
		lastName: "Galley",
		mrn: "5705674619",
		gender: "Male",
		dateOfBirth: "3/1/1950",
		age: 74,
	},
	{
		firstName: "Gayle",
		lastName: "Worcs",
		mrn: "2496219881",
		gender: "Female",
		dateOfBirth: "6/7/1955",
		age: 69,
	},
];

const patientService = {
	vitalSigns: {
		save: saveVitalSigns,
		load: getVitalSigns,
	},
	getPatient: fetchPatient,
};

function saveVitalSigns(formData) {
	// Don't save if everything is empty
	let fieldsWithValues = Array.from(formData.entries())
		.filter(([key, value]) => key !== 'vital-sign-mrn' && !!value);
	
	if(!fieldsWithValues.length){
		return false;
	}
	
    const mrn = formData.get("vital-sign-mrn");

	const vitalSigns = {
		date: new Date().getTime(),
		bp: {
			sys: formData.get("bp-sys"),
			dia: formData.get("bp-dia"),
		},
		temp: formData.get("temperature"),
		pulse: formData.get("pulse"),
		o2: formData.get("o2"),
		resp: formData.get("respirations"),
		pain: formData.get("pain"),
		height: convertHeightToInches(formData.get("height-feet"), formData.get("height-inches")),
		weight: formData.get("weight"),
	};

	let vitalSignHistory = getVitalSigns(mrn);

	/**
	 * Delete the last history entry if it has the same date as the form data.
	 *  We only want to save one entry per day.
	 */
	let lastMidnight = new Date(vitalSigns.date).setHours(0, 0, 0, 0);
	let lastEntryDate = vitalSignHistory?.[vitalSignHistory.length - 1]?.date;
	if (lastEntryDate && lastEntryDate > lastMidnight) {
		vitalSignHistory.pop();
	}

	vitalSignHistory.push(vitalSigns);
	vitalSignHistory = vitalSignHistory.slice(0, 4);
	storeData(mrn, vitalSignHistory);
	return true;
}

/**
 * Get the patient's vital signs history.
 * First, try to get history from local storage. If that is not available, get 
 * history from the patientData object.
 * @param {String} mrn
 * @returns The patient's vital signs history array, or an empty array if no history is found.
 */
function getVitalSigns(mrn) {
	let vitalSigns = fetchData(mrn);
	if (!vitalSigns?.length) {
        
		vitalSigns = patientService.getPatient(mrn)?.vitalSigns || [];
	}

	// Sort by date, oldest first
	vitalSigns.sort((a, b) => a.date - b.date);

	return vitalSigns;
}

function convertHeightToInches(feet, inches) {
	return (Number(feet) * 12 + Number(inches)) || null;
}

function fetchPatient(mrn) {
	return patientData.find((p) => p.mrn === mrn);
}

function fetchData(key) {
    const data = localStorage.getItem(key);
    if(data){
        return JSON.parse(data);
    }
	return null;
}

function storeData(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}
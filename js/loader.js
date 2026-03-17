const boutonurl = document.getElementById('btnRechercheURL');
const boutoncsv = document.getElementById('btnRechercheCSV');
test = document.getElementById('test');
test2 = document.getElementById('test2')

boutonurl.addEventListener('click', () => {
  const valeur = document.getElementById('URL_finder').value;
  test.textContent = valeur
  console.log(valeur);
});

document.getElementById('monFichier').addEventListener('change', (e) => {
  const file = e.target.files[0]; 
  console.log(file);
});

boutoncsv.addEventListener('click', () => {
  const valeur = document.getElementById('CSV_analyser').value;
  test2.textContent = valeur
  console.log(valeur);
});
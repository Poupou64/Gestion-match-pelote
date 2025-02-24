const btnInscrire = document.getElementById('btnInscrire');
const btnCommencer = document.getElementById('btnCommencer');
const btnFinir = document.getElementById('btnFinir');
const btnReinitialiser = document.getElementById('btnReinitialiser');
const nomJoueurInput = document.getElementById('nomJoueur');
const listeJoueurs = document.getElementById('listeJoueurs');
const messageMatch = document.getElementById('messageMatch');
const historiqueMatchs = document.getElementById('historiqueMatchs');

let joueurs = [];
let joueursSelectionnes = [];

// Handle player registration
function inscrireJoueur() {
    const nomJoueur = nomJoueurInput.value.trim();
    if (nomJoueur) {
        const exist = joueurs.find(j => j.nom === nomJoueur);
        if (exist) {
            alert("Ce joueur est déjà inscrit !");
            return;
        }
        const joueur = {
            nom: nomJoueur,
            heuresInscription: new Date().toLocaleTimeString(), // Affiche seulement l'heure
            matchsJoues: 0,
            matchsAttendus: 0
        };
        joueurs.push(joueur);
        afficherJoueurs();
        nomJoueurInput.value = ''; // Réinitialiser le champ d'entrée
    } else {
        alert("Veuillez entrer un nom valide !");
    }
}

// Listen for events on the button and input field
btnInscrire.addEventListener('click', inscrireJoueur);
nomJoueurInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        inscrireJoueur();
    }
});

// Function to clear the player list and history
function reinitialiserListe() {
    const confirmation = confirm("Êtes-vous sûr de vouloir réinitialiser ? Cela supprimera la liste des inscrits et l'historique des matchs.");
    
    if (confirmation) {
        joueurs = [];
        joueursSelectionnes = [];
        historiqueMatchs.innerHTML = ''; // Vider l'historique des matchs
        afficherJoueurs();
        messageMatch.textContent = '';
    }
}

btnReinitialiser.addEventListener('click', reinitialiserListe);

// Display list of registered players with checkboxes
function afficherJoueurs() {
    listeJoueurs.innerHTML = '';
    joueurs.forEach((joueur, index) => {
        const li = document.createElement('li');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `joueur${index}`;
        checkbox.value = joueur.nom;

        checkbox.checked = joueursSelectionnes.includes(joueur.nom); // Affiche le statut sélectionné

        checkbox.addEventListener('change', () => {
            const nom = joueur.nom;

            if (checkbox.checked) {
                if (joueursSelectionnes.length < 4) {
                    joueursSelectionnes.push(nom);
                    joueur.matchsAttendus = 0; // Reset expected matches
                } else {
                    alert("Vous ne pouvez sélectionner que 4 joueurs !");
                    checkbox.checked = false; // Déselectionner le checkbox
                }
            } else {
                joueursSelectionnes = joueursSelectionnes.filter(j => j !== nom);
            }

            btnCommencer.disabled = joueursSelectionnes.length !== 4;
        });

        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(`${joueur.nom} - Inscrit à ${joueur.heuresInscription} - Joué(s): `));

        const matchsJouesSpan = document.createElement('span');
        matchsJouesSpan.textContent = joueur.matchsJoues;
        matchsJouesSpan.classList.toggle('text-red', joueur.matchsJoues === 0);
        li.appendChild(matchsJouesSpan);

        li.appendChild(document.createTextNode(` - Attendu(s): `));

        const matchsAttendusSpan = document.createElement('span');
        matchsAttendusSpan.textContent = joueur.matchsAttendus;
        matchsAttendusSpan.classList.toggle('text-orange', joueur.matchsAttendus >= 2);
        li.appendChild(matchsAttendusSpan);

        const btnDesinscrire = document.createElement('button');
        btnDesinscrire.textContent = 'Désinscrire';
        btnDesinscrire.onclick = () => {
            if (checkbox.checked) {
                checkbox.checked = false; // Déselectionner en cas de désinscription
                joueursSelectionnes = joueursSelectionnes.filter(j => j !== joueur.nom);
            }
            joueurs.splice(index, 1);
            afficherJoueurs();
        };

        li.appendChild(btnDesinscrire);
        listeJoueurs.appendChild(li);
    });
}

// Start the match
btnCommencer.addEventListener('click', () => {
    if (joueursSelectionnes.length === 4) {
        messageMatch.textContent = `Match en cours: ${joueursSelectionnes.join(', ')}`;
        btnFinir.disabled = false;
        btnCommencer.disabled = true;

        joueurs.forEach(joueur => {
            if (!joueursSelectionnes.includes(joueur.nom)) {
                joueur.matchsAttendus++; // Increment expected matches for unselected players
            }
        });
    }
});

// End the match
btnFinir.addEventListener('click', () => {
    const matchHistoryItem = document.createElement('li');
    matchHistoryItem.textContent = `${new Date().toLocaleString()} - Terminé: ${joueursSelectionnes.join(', ')}`; 

    // Insérer le nouvel élément en tête de liste
    historiqueMatchs.insertBefore(matchHistoryItem, historiqueMatchs.firstChild); 
    
    joueursSelectionnes.forEach(nom => {
        const joueur = joueurs.find(j => j.nom === nom);
        if (joueur) {
            joueur.matchsJoues++; // Increment matches played
        }
    });
    
    messageMatch.textContent = '';
    joueursSelectionnes = [];
    btnFinir.disabled = true;
    btnCommencer.disabled = true;

    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('#listeJoueurs input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);

    afficherJoueurs();
});

const btnInscrire = document.getElementById('btnInscrire');
const btnCommencer = document.getElementById('btnCommencer');
const btnFinir = document.getElementById('btnFinir');
const btnReinitialiser = document.getElementById('btnReinitialiser'); // Nouveau bouton
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
            heuresInscription: new Date().toLocaleString(),
            matchsJoues: 0,
            matchsAttendus: 0 // Nouveau champ pour le nombre de matchs attendus
        };
        joueurs.push(joueur);
        afficherJoueurs();
        nomJoueurInput.value = ''; // Clear input after registration
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

// Function to clear the player list
function reinitialiserListe() {
    joueurs = []; // Reset the players array
    joueursSelectionnes = []; // Reset selected players
    afficherJoueurs(); // Refresh the display
    messageMatch.textContent = ''; // Clear match message
}

// Listen for the reset button event
btnReinitialiser.addEventListener('click', reinitialiserListe);

// Display list of registered players with checkboxes
function afficherJoueurs() {
    listeJoueurs.innerHTML = '';
    joueurs.forEach((joueur, index) => {
        const li = document.createElement('li');
        
        // Create a checkbox for selecting the player
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `joueur${index}`;
        checkbox.value = joueur.nom;
        
        // Listen for checkbox changes
        checkbox.addEventListener('change', () => {
            const nom = joueur.nom;
            if (checkbox.checked) {
                // When selected, reset the expected matches to 0
                joueur.matchsAttendus = 0;
                
                if (joueursSelectionnes.length < 4) {
                    joueursSelectionnes.push(nom);
                } else {
                    alert("Vous ne pouvez sélectionner que 4 joueurs !");
                    checkbox.checked = false; // Uncheck if limit is reached
                }
            } else {
                joueursSelectionnes = joueursSelectionnes.filter(j => j !== nom);
            }
            btnCommencer.disabled = joueursSelectionnes.length !== 4;
        });

        li.appendChild(checkbox);
        
        // Player's information with unsubscribe button
        li.appendChild(document.createTextNode(`${joueur.nom} - Inscrit à ${joueur.heuresInscription} - Matchs joués: `));
        
        // Create a span for matchs joués
        const matchsJouesSpan = document.createElement('span');
        matchsJouesSpan.textContent = joueur.matchsJoues;
        if (joueur.matchsJoues === 0) {
            matchsJouesSpan.classList.add('text-red');
        }
        li.appendChild(matchsJouesSpan);

        li.appendChild(document.createTextNode(` - Matchs attendus: `));
        
        // Create a span for matchs attendus
        const matchsAttendusSpan = document.createElement('span');
        matchsAttendusSpan.textContent = joueur.matchsAttendus;
        if (joueur.matchsAttendus >= 2) {
            matchsAttendusSpan.classList.add('text-orange');
        }
        li.appendChild(matchsAttendusSpan);

        const btnDesinscrire = document.createElement('button');
        btnDesinscrire.textContent = 'Désinscrire';
        btnDesinscrire.onclick = () => {
            joueurs.splice(index, 1);
            joueursSelectionnes = joueursSelectionnes.filter(j => j !== joueur.nom); // Remove from selection if exists
            afficherJoueurs();
        };
        
        li.appendChild(btnDesinscrire);
        listeJoueurs.appendChild(li);
    });
}

// Start the match
btnCommencer.addEventListener('click', () => {
    messageMatch.textContent = `Match en cours: ${joueursSelectionnes.join(', ')}`;
    btnFinir.disabled = false;
    btnCommencer.disabled = true;
    // Reset matchsAttendus for players who are selected
    joueurs.forEach(joueur => {
        if (!joueursSelectionnes.includes(joueur.nom)) {
            joueur.matchsAttendus += 1; // Increment expected matches for unselected players
        }
    });
});

// End the match
btnFinir.addEventListener('click', () => {
    const matchHistoryItem = document.createElement('li');
    matchHistoryItem.textContent = `${new Date().toLocaleString()} - Match terminé entre ${joueursSelectionnes.join(', ')}`;
    historiqueMatchs.appendChild(matchHistoryItem);
    
    joueursSelectionnes.forEach(nom => {
        const joueur = joueurs.find(j => j.nom === nom);
        if (joueur) {
            joueur.matchsJoues += 1; // Increment the match count
        }
    });
    
    // Reset player selection after the match
    messageMatch.textContent = '';
    joueursSelectionnes = [];
    btnFinir.disabled = true;
    btnCommencer.disabled = true;

    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('#listeJoueurs input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);

    // Refresh player list to show updated match played count
    afficherJoueurs();
});

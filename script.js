// Imports de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, update, query, orderByChild, equalTo, get, push } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

// Configuration Firebase
const firebaseConfig = {
    // ... vos informations de configuration Firebase ici ...
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Sélectionner les boutons et les éléments DOM
const btnInscrire = document.getElementById('btnInscrire');
const btnCommencer = document.getElementById('btnCommencer');
const btnFinir = document.getElementById('btnFinir');
const btnReinitialiser = document.getElementById('btnReinitialiser');
const nomJoueurInput = document.getElementById('nomJoueur');
const listeJoueurs = document.getElementById('listeJoueurs');
const messageMatch = document.getElementById('messageMatch');
const historiqueMatchs = document.getElementById('historiqueMatchs');

let joueursSelectionnes = [];

// Références Firebase
const listeJoueursRef = ref(database, 'joueurs');
const matchRef = ref(database, 'matchEnCours');
const historiqueMatchsRef = ref(database, 'historiqueMatchs');

// Écouter les changements sur la liste de joueurs
onValue(listeJoueursRef, (snapshot) => {
    const data = snapshot.val();
    afficherJoueurs(data);
    mettreAJourJoueursSelectionnes(data); // Met à jour les joueurs sélectionnés
});

// Écouter les changements sur le match en cours
onValue(matchRef, (snapshot) => {
    const matchData = snapshot.val();
    if (matchData) {
        messageMatch.textContent = `Match en cours: ${matchData.joueurs.join(', ')}`;
        joueursSelectionnes = matchData.joueurs;
        setBoutonEtatMatchEnCours();
    } else {
        messageMatch.textContent = '';
        joueursSelectionnes = [];
        setBoutonEtatMatchNonEnCours();
    }
});

// Afficher les joueurs inscrits
function afficherJoueurs(data) {
    listeJoueurs.innerHTML = ''; // Vide la liste avant de la remplir
    if (data) {
        for (const key in data) {
            const joueur = data[key];

            if (joueur && joueur.nom && joueur.heuresInscription) {
                const nom = joueur.nom;
                const heuresInscription = joueur.heuresInscription || "Inconnu";
                const matchsJoues = joueur.matchsJoues || 0;

                const li = document.createElement('li');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = key;
                checkbox.checked = joueur.selectionne || false;

                checkbox.addEventListener('change', () => {
                    const joueurRef = ref(database, 'joueurs/' + key);
                    update(joueurRef, { selectionne: checkbox.checked });

                    if (checkbox.checked) {
                        if (joueursSelectionnes.length < 4) {
                            joueursSelectionnes.push(nom);
                        } else {
                            // Si 4 joueurs sont déjà sélectionnés, ne pas permettre la sélection
                            checkbox.checked = false; // Décochez la case
                            alert("Vous ne pouvez sélectionner que 4 joueurs !");
                        }
                    } else {
                        // Si la case est décochée, retirer le joueur de la liste des sélectionnés
                        joueursSelectionnes = joueursSelectionnes.filter(j => j !== nom);
                    }

                    // Mettez à jour l'état du bouton seulement ici
                    btnCommencer.disabled = joueursSelectionnes.length !== 4; // Actualisez le statut ici
                });

                li.appendChild(checkbox);
                li.appendChild(document.createTextNode(`${nom} - Inscrit à ${heuresInscription} - Joué(s): ${matchsJoues}`)); 
                listeJoueurs.appendChild(li);
            }
        }
    }
}

// ... les autres fonctions restent identiques ...

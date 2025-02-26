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

// Sélection des éléments DOM
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
    mettreAJourJoueursSelectionnes(data);
});

// ... (le reste de la configuration Firebase et des écouter)

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
                            // Si 4 joueurs sont déjà sélectionnés, vous ne pouvez pas en sélectionner un de plus
                            checkbox.checked = false; // Re-désélectionner la case à cocher
                            alert("Vous ne pouvez sélectionner que 4 joueurs !");
                        }
                    } else {
                        // Si la case est décochée, retirer le joueur de la liste des sélectionnés
                        joueursSelectionnes = joueursSelectionnes.filter(j => j !== nom);
                    }

                    // Vérifiez si 4 joueurs sont sélectionnés pour activer/désactiver le bouton "Commencer Match"
                    btnCommencer.disabled = joueursSelectionnes.length !== 4;
                });

                li.appendChild(checkbox);
                li.appendChild(document.createTextNode(`${nom} - Inscrit à ${heuresInscription} - Joué(s): ${matchsJoues}`)); 
                listeJoueurs.appendChild(li);
            }
        }
    }
}

// Démarrer le match
btnCommencer.addEventListener('click', async () => {
    if (joueursSelectionnes.length === 4) {
        // Création des données du match
        const matchData = {
            date: new Date().toISOString(),
            joueurs: joueursSelectionnes
        };

        try {
            await set(matchRef, matchData);
            messageMatch.textContent = `Match en cours: ${joueursSelectionnes.join(', ')}`;
            // Désactiver le bouton "Commencer" immédiatement pour éviter les doubles clics
            btnCommencer.disabled = true;

            // Réinitialiser les matchs attendus pour tous les joueurs sélectionnés
            for (const nom of joueursSelectionnes) {
                const joueurRef = ref(database, 'joueurs/' + nom);
                await update(joueurRef, { matchsAttendus: 0 }); // Reset des matchs attendus
            }

            // Afficher l'état avec le match en cours
            setBoutonEtatMatchEnCours();
        } catch (error) {
            console.error("Erreur lors du démarrage du match :", error);
            alert("Une erreur est survenue lors du démarrage du match. Veuillez réessayer.");
        }
    } else {
        alert("Veuillez sélectionner 4 joueurs avant de commencer le match.");
    }
});

// ... (le reste des fonctions pour finir le match, les inscriptions, etc.)

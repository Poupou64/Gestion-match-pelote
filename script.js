// Imports de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, update } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

// Votre configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAyd1LEO2nwW7gQxhF4vl47IogXtrFVa3o",
    authDomain: "base-de-donnees-pelote-blagnac.firebaseapp.com",
    databaseURL: "https://base-de-donnees-pelote-blagnac-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "base-de-donnees-pelote-blagnac",
    storageBucket: "base-de-donnees-pelote-blagnac.firebasestorage.app",
    messagingSenderId: "384807205672",
    appId: "1:384807205672:web:58226cac9881f425ddee1d",
    measurementId: "G-TSLYZVKV6R"
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

// Référence à la base de données des joueurs
const listeJoueursRef = ref(database, 'joueurs');

// Écouter les changements sur la liste de joueurs
onValue(listeJoueursRef, (snapshot) => {
    afficherJoueurs(snapshot.val());
});

// Fonction d'inscription
function inscrireJoueur() {
    const nomJoueur = nomJoueurInput.value.trim();
    if (nomJoueur) {
        const newPlayerRef = ref(database, 'joueurs/' + Date.now()); // Utiliser l'heure actuelle comme clé
        set(newPlayerRef, {
            nom: nomJoueur,
            heuresInscription: new Date().toLocaleTimeString(),
            matchsJoues: 0,
            matchsAttendus: 0
        });
        nomJoueurInput.value = ''; // Réinitialiser le champ d'entrée
    } else {
        alert("Veuillez entrer un nom valide !");
    }
}

// Réinitialiser la liste et l'historique
function reinitialiserListe() {
    const confirmation = confirm("Êtes-vous sûr de vouloir réinitialiser ? Cela supprimera la liste des inscrits et l'historique des matchs.");
    if (confirmation) {
        remove(listeJoueursRef); // Supprime tous les joueurs de la base de données
        joueursSelectionnes = [];
        historiqueMatchs.innerHTML = ''; // Vider l'historique des matchs
        messageMatch.textContent = '';
    }
}

// Afficher les joueurs inscrits
function afficherJoueurs(data) {
    listeJoueurs.innerHTML = '';
    if (data) {
        for (const key in data) {
            const joueur = data[key];
            const li = document.createElement('li');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `joueur${key}`;
            checkbox.value = joueur.nom;

            checkbox.checked = joueursSelectionnes.includes(joueur.nom); // Affiche le statut sélectionné

            checkbox.addEventListener('change', () => {
                const nom = joueur.nom;

                if (checkbox.checked) {
                    if (joueursSelectionnes.length < 4) {
                        joueursSelectionnes.push(nom);
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
            li.appendChild(matchsJouesSpan);

            const btnDesinscrire = document.createElement('button');
            btnDesinscrire.textContent = 'Désinscrire';
            btnDesinscrire.onclick = () => {
                const joueurRef = ref(database, 'joueurs/' + key);
                remove(joueurRef); // Supprime le joueur de la base de données
            };

            li.appendChild(btnDesinscrire);
            listeJoueurs.appendChild(li);
        }
    }
}

// Démarrer le match
btnCommencer.addEventListener('click', () => {
    if (joueursSelectionnes.length === 4) {
        messageMatch.textContent = `Match en cours: ${joueursSelectionnes.join(', ')}`;
        btnFinir.disabled = false;
        btnCommencer.disabled = true;

        joueursSelectionnes.forEach(nom => {
            const joueurRef = ref(database, 'joueurs/' + nom);
            update(joueurRef, { matchsAttendus: 0 }); // Reset expected matches
        });
    }
});

// Finir le match
btnFinir.addEventListener('click', () => {
    const matchHistoryItem = document.createElement('li');
    matchHistoryItem.textContent = `${new Date().toLocaleString()} - Terminé: ${joueursSelectionnes.join(', ')}`;
    historiqueMatchs.insertBefore(matchHistoryItem, historiqueMatchs.firstChild); 

    joueursSelectionnes.forEach(nom => {
        const joueurRef = ref(database, 'joueurs/' + nom);
        update(joueurRef, { matchsJoues: (joueur.matchsJoues || 0) + 1 }); // Increment matches played
    });

    messageMatch.textContent = '';
    joueursSelectionnes = [];
    btnFinir.disabled = true;
    btnCommencer.disabled = true;

    // Déselectionner tous les checkboxes
    const checkboxes = document.querySelectorAll('#listeJoueurs input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
});

// Écoutez les événements
btnInscrire.addEventListener('click', inscrireJoueur);
btnReinitialiser.addEventListener('click', reinitialiserListe);

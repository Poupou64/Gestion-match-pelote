// Imports de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, update, query, orderByChild, equalTo, get, push } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

// Configuration Firebase
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

// Références Firebase
const listeJoueursRef = ref(database, 'joueurs');
const matchRef = ref(database, 'matchEnCours');
const historiqueMatchsRef = ref(database, 'historiqueMatchs');

// Écoute des changements sur la liste de joueurs
onValue(listeJoueursRef, (snapshot) => {
    const data = snapshot.val();
    afficherJoueurs(data);
});

// Écoute des changements sur le match en cours
onValue(matchRef, (snapshot) => {
    const matchData = snapshot.val();
    if (matchData) {
        messageMatch.textContent = `Match en cours: ${matchData.joueurs.join(', ')}`;
        setBoutonEtatMatchEnCours();
    } else {
        messageMatch.textContent = '';
        setBoutonEtatMatchNonEnCours();
    }
});

// Écoute des changements sur l'historique des matchs
onValue(historiqueMatchsRef, (snapshot) => {
    const data = snapshot.val();
    historiqueMatchs.innerHTML = '';
    if (data) {
        for (const key in data) {
            const match = data[key];
            const li = document.createElement('li');
            li.textContent = `${match.date} - Terminé: ${match.joueurs.join(', ')}`;
            historiqueMatchs.appendChild(li);
        }
    }
});

// Vérifie si le nom du joueur est déjà inscrit
async function nomJoueurDejaInscrit(nom) {
    const joueursRef = ref(database, 'joueurs');
    const joueursQuery = query(joueursRef, orderByChild('nom'), equalTo(nom));

    const snapshot = await get(joueursQuery);
    return snapshot.exists(); // Renvoie true si le joueur existe déjà
}

// Fonction d'inscription
async function inscrireJoueur() {
    const nomJoueur = nomJoueurInput.value.trim();
    console.log("Nom du joueur à inscrire:", nomJoueur); // Debug
    if (nomJoueur) {
        // Vérifie si le joueur est déjà inscrit
        if (await nomJoueurDejaInscrit(nomJoueur)) {
            alert("Ce joueur est déjà inscrit !");
            return;
        }

        const newPlayerRef = ref(database, 'joueurs/' + Date.now()); // Utilise l'heure actuelle comme clé
        try {
            await set(newPlayerRef, {
                nom: nomJoueur,
                heuresInscription: new Date().toLocaleTimeString(),
                matchsJoues: 0,
                matchsAttendus: 0,
                selectionne: false // Ajouter cette propriété initialement
            });
            nomJoueurInput.value = ''; // Réinitialise le champ d'entrée
        } catch (error) {
            console.error("Erreur lors de l'inscription du joueur : ", error);
            alert("Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
        }
    } else {
        alert("Veuillez entrer un nom valide !");
    }
}

// Réinitialiser la liste et l'historique
function reinitialiserListe() {
    const confirmation = confirm("Êtes-vous sûr de vouloir réinitialiser ? Cela supprimera la liste des inscrits et l'historique des matchs.");
    if (confirmation) {
        // Supprimer tous les joueurs de la base de données
        remove(listeJoueursRef)
            .then(() => {
                return remove(matchRef); // Supprimer le match en cours
            })
            .then(() => {
                return remove(historiqueMatchsRef); // Supprimer l'historique des matchs
            })
            .then(() => {
                joueursSelectionnes = [];
                historiqueMatchs.innerHTML = ''; // Vider l'historique des matchs
                messageMatch.textContent = ''; // Réinitialiser le message de match
                setBoutonEtatMatchNonEnCours(); // Réinitialiser les boutons
            })
            .catch((error) => {
                console.error("Erreur lors de la réinitialisation de la base de données :", error);
                alert("Une erreur est survenue lors de la réinitialisation. Veuillez réessayer.");
            });
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
            checkbox.value = key;

            checkbox.checked = joueur.selectionne || false; // Met à jour selon l'état dans Firebase

            checkbox.addEventListener('change', () => {
                const joueurRef = ref(database, 'joueurs/' + key);
                update(joueurRef, { selectionne: checkbox.checked });

                const nom = joueur.nom;

                if (checkbox.checked) {
                    if (joueursSelectionnes.length < 4) {
                        joueursSelectionnes.push(nom);
                    } else {
                        alert("Vous ne pouvez sélectionner que 4 joueurs !");
                        checkbox.checked = false;
                    }
                } else {
                    joueursSelectionnes = joueursSelectionnes.filter(j => j !== nom);
                }

                btnCommencer.disabled = joueursSelectionnes.length !== 4;
            });

            li.appendChild(checkbox);
            li.appendChild(document.createTextNode(`${joueur.nom} - Inscrit à ${joueur.heuresInscription} - Joué(s): `));

            // Span pour "matchs joués"
            const matchsJouesSpan = document.createElement('span');
            matchsJouesSpan.className = 'matchs-joues';
            matchsJouesSpan.textContent = joueur.matchsJoues;
            li.appendChild(matchsJouesSpan);

            // Span pour "matchs attendus"
            const matchsAttendusSpan = document.createElement('span');
            matchsAttendusSpan.className = 'matchs-attendus';
            matchsAttendusSpan.textContent = ` / Attendu(s): ${joueur.matchsAttendus}`;
            li.appendChild(matchsAttendusSpan);

            const btnDesinscrire = document.createElement('button');
            btnDesinscrire.textContent = 'Désinscrire';
            btnDesinscrire.onclick = () => {
                const joueurRef = ref(database, 'joueurs/' + key);
                remove(joueurRef);
            };

            li.appendChild(btnDesinscrire);
            listeJoueurs.appendChild(li);
        }
    }
}

// Fonctions pour gérer l'état des boutons
function setBoutonEtatMatchEnCours() {
    btnFinir.disabled = false; // Activer le bouton "Finir"
    btnCommencer.disabled = true; // Désactiver le bouton "Commencer"
}

function setBoutonEtatMatchNonEnCours() {
    btnFinir.disabled = true; // Désactiver le bouton "Finir"
    btnCommencer.disabled = false; // Activer le bouton "Commencer"
}

// Démarrer le match
btnCommencer.addEventListener('click', () => {
    if (joueursSelectionnes.length === 4) {
        const matchData = {
            date: new Date().toISOString(),
            joueurs: joueursSelectionnes
        };

        // Enregistrer les informations du match dans la base de données
        set(matchRef, matchData)
            .then(() => {
                messageMatch.textContent = `Match en cours: ${joueursSelectionnes.join(', ')}`;
                setBoutonEtatMatchEnCours();
                
                // Réinitialiser les matchs attendus pour chaque joueur
                joueursSelectionnes.forEach(nom => {
                    const joueurRef = ref(database, 'joueurs/' + nom);
                    update(joueurRef, { matchsAttendus: 0 });
                });
            })
            .catch((error) => {
                console.error("Erreur lors du démarrage du match :", error);
            });
    } else {
        alert("Veuillez sélectionner 4 joueurs avant de commencer le match.");
    }
});

// Finir le match
btnFinir.addEventListener('click', () => {
    const matchHistoryItem = {
        date: new Date().toLocaleString(),
        joueurs: joueursSelectionnes
    };

    // Ajouter les détails du match à l'historique
    push(historiqueMatchsRef, matchHistoryItem)
        .then(() => {
            const matchHistoryItemElement = document.createElement('li');
            matchHistoryItemElement.textContent = `${matchHistoryItem.date} - Terminé: ${joueursSelectionnes.join(', ')}`;
            historiqueMatchs.insertBefore(matchHistoryItemElement, historiqueMatchs.firstChild);

            // Mettre à jour les matchs joués pour chaque joueur
            joueursSelectionnes.forEach(nom => {
                const joueurRef = ref(database, 'joueurs/' + nom);
                update(joueurRef, { matchsJoues: (joueur.matchsJoues || 0) + 1 });
            });

            // Réinitialiser les états
            messageMatch.textContent = '';
            joueursSelectionnes = [];
            setBoutonEtatMatchNonEnCours();

            // Déselectionner tous les checkboxes
            const checkboxes = document.querySelectorAll('#listeJoueurs input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = false);
        })
        .catch((error) => {
            console.error("Erreur lors de l'enregistrement dans l'historique :", error);
        });
});

// Écoutez les événements
btnInscrire.addEventListener('click', inscrireJoueur);
btnReinitialiser.addEventListener('click', reinitialiserListe);

// Écoute de la saisie de l'utilisateur pour la touche "Entrée"
nomJoueurInput.addEventListener('keypress', (event) => {
    console.log('Touche pressée:', event.key); // Debug
    if (event.key === 'Enter') {
        console.log('Entrée détectée, inscription du joueur');
        inscrireJoueur();
    }
});

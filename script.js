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

// Écouter les changements sur la liste de joueurs
onValue(listeJoueursRef, (snapshot) => {
    afficherJoueurs(snapshot.val());
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

// Écouter les changements sur l'historique des matchs
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

// Vérifier si le nom du joueur est déjà inscrit
async function nomJoueurDejaInscrit(nom) {
    const joueursRef = ref(database, 'joueurs');
    const joueursQuery = query(joueursRef, orderByChild('nom'), equalTo(nom));
    const snapshot = await get(joueursQuery);
    return snapshot.exists();
}

// Fonction d'inscription
async function inscrireJoueur() {
    const nomJoueur = nomJoueurInput.value.trim();
    if (nomJoueur) {
        if (await nomJoueurDejaInscrit(nomJoueur)) {
            alert("Ce joueur est déjà inscrit !");
            return;
        }

        const newPlayerRef = ref(database, 'joueurs/' + Date.now());
        try {
            await set(newPlayerRef, {
                nom: nomJoueur,
                heuresInscription: new Date().toLocaleTimeString(),
                matchsJoues: 0,
                matchsAttendus: 0,
                selectionne: false
            });
            nomJoueurInput.value = ''; // Réinitialiser le champ après l'inscription
        } catch (error) {
            console.error("Erreur lors de l'inscription du joueur : ", error);
            alert("Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
        }
    } else {
        alert("Veuillez entrer un nom valide !");
    }
}

// Réinitialiser la liste et l'historique
async function reinitialiserListe() {
    const confirmation = confirm("Êtes-vous sûr de vouloir réinitialiser ? Cela supprimera la liste des inscrits et l'historique des matchs.");
    if (confirmation) {
        try {
            await remove(listeJoueursRef);
            await remove(matchRef);
            await remove(historiqueMatchsRef);
            joueursSelectionnes = [];
            historiqueMatchs.innerHTML = '';
            messageMatch.textContent = '';
            setBoutonEtatMatchNonEnCours();
        } catch (error) {
            console.error("Erreur lors de la réinitialisation de la base de données :", error);
            alert("Une erreur est survenue lors de la réinitialisation. Veuillez réessayer.");
        }
    }
}

// Afficher les joueurs inscrits
function afficherJoueurs(data) {
    listeJoueurs.innerHTML = '';
    if (data) {
        for (const key in data) {
            const joueur = data[key];

            if (joueur && joueur.nom && joueur.heuresInscription) {
                const nom = joueur.nom;
                const heuresInscription = joueur.heuresInscription;
                const matchsJoues = joueur.matchsJoues || 0;
                const matchsAttendus = joueur.matchsAttendus || 0;

                const li = document.createElement('li');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `joueur${key}`;
                checkbox.value = key;
                checkbox.checked = joueur.selectionne || false;

                checkbox.addEventListener('change', () => {
                    const joueurRef = ref(database, 'joueurs/' + key);
                    update(joueurRef, { selectionne: checkbox.checked });

                    if (checkbox.checked) {
                        if (joueursSelectionnes.length < 4) {
                            joueursSelectionnes.push(nom);
                        } else {
                            alert("Vous ne pouvez sélectionner que 4 joueurs !");
                            checkbox.checked = false; // Re-désélectionner visuellement
                        }
                    } else {
                        joueursSelectionnes = joueursSelectionnes.filter(j => j !== nom);
                    }

                    btnCommencer.disabled = joueursSelectionnes.length !== 4; 
                });

                const matchsJouesSpan = document.createElement('span');
                matchsJouesSpan.textContent = `Joué(s): ${matchsJoues}`;
                const matchsAttendusSpan = document.createElement('span');
                matchsAttendusSpan.textContent = `Attendu(s): ${matchsAttendus}`;

                matchsJouesSpan.classList.toggle('text-red', matchsJoues === 0);
                matchsAttendusSpan.classList.toggle('text-orange', matchsAttendus >= 2);

                li.appendChild(checkbox);
                li.appendChild(document.createTextNode(`${nom} - Inscrit à ${heuresInscription} - `));
                li.appendChild(matchsJouesSpan);
                li.appendChild(document.createTextNode(' / '));
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
}

// Fonctions pour gérer l'état des boutons
function setBoutonEtatMatchEnCours() {
    btnFinir.disabled = false; 
    btnCommencer.disabled = true; 
}

function setBoutonEtatMatchNonEnCours() {
    btnFinir.disabled = true; 
    btnCommencer.disabled = false; 
}

// Démarrer le match
btnCommencer.addEventListener('click', async () => {
    if (joueursSelectionnes.length === 4) {
        const matchData = {
            date: new Date().toISOString(),
            joueurs: joueursSelectionnes
        };

        try {
            await set(matchRef, matchData);
            messageMatch.textContent = `Match en cours: ${joueursSelectionnes.join(', ')}`;
            setBoutonEtatMatchEnCours();
        } catch (error) {
            console.error("Erreur lors du démarrage du match :", error);
            alert("Une erreur est survenue lors du démarrage du match. Veuillez réessayer.");
        }
    } else {
        alert("Veuillez sélectionner 4 joueurs avant de commencer le match.");
    }
});

// Finir le match
btnFinir.addEventListener('click', async () => {
    const matchHistoryItem = {
        date: new Date().toLocaleString(),
        joueurs: joueursSelectionnes
    };

    try {
        await push(historiqueMatchsRef, matchHistoryItem); // Pousser à l'historique

        // Mettre à jour les matchs joués pour chaque joueur
        await Promise.all(
            joueursSelectionnes.map(async (nom) => {
                const joueurRef = ref(database, 'joueurs/' + nom);
                const joueurSnap = await get(joueurRef);
                const joueur = joueurSnap.val();
                await update(joueurRef, { matchsJoues: (joueur.matchsJoues || 0) + 1 });
            })
        );

        // Réinitialiser l'état pour permettre un nouveau match
        messageMatch.textContent = '';
        joueursSelectionnes = [];
        btnFinir.disabled = true; // Griser le bouton

        // Supprime le match en cours de Firebase
        await remove(matchRef);

        // Incrémenter matchsAttendus pour les joueurs non sélectionnés
        const tousLesJoueursRef = ref(database, 'joueurs');
        const snapshotTousLesJoueurs = await get(tousLesJoueursRef);

        if (snapshotTousLesJoueurs.exists()) {
            const tousLesJoueursData = snapshotTousLesJoueurs.val();
            for (const key in tousLesJoueursData) {
                if (!joueursSelectionnes.includes(tousLesJoueursData[key].nom)) {
                    const joueurRef = ref(database, 'joueurs/' + key);
                    await update(joueurRef, { matchsAttendus: (tousLesJoueursData[key].matchsAttendus || 0) + 1 });
                }
            }
        }

        // Mettre à jour l'affichage des joueurs après la fin du match
        afficherJoueurs(snapshotTousLesJoueurs.val());

    } catch (error) {
        console.error("Erreur lors de l'enregistrement dans l'historique :", error);
    }
});

// Écoutez les événements
btnInscrire.addEventListener('click', inscrireJoueur);
btnReinitialiser.addEventListener('click', reinitialiserListe);
nomJoueurInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        inscrireJoueur();
    }
});

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

// Fonction d'inscription du joueur
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
    listeJoueurs.innerHTML = ''; // Vide la liste avant de la remplir
    if (data) {
        for (const key in data) {
            const joueur = data[key];

            if (joueur && joueur.nom && joueur.heuresInscription) {
                const nom = joueur.nom;
                const heuresInscription = joueur.heuresInscription || "Inconnu";
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

                    // Mettre à jour les joueurs sélectionnés localement
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

                    // Vérifiez si 4 joueurs sont sélectionnés pour activer le bouton "Commencer Match"
                    btnCommencer.disabled = joueursSelectionnes.length !== 4; 
                });

                // Créer des éléments pour les matchs joués et attendus
                const matchsJouesSpan = document.createElement('span');
                matchsJouesSpan.textContent = `Joué(s): ${matchsJoues}`;
                const matchsAttendusSpan = document.createElement('span');
                matchsAttendusSpan.textContent = `Attendu(s): ${matchsAttendus}`;

                // Appliquer les couleurs
                if (matchsJoues === 0) {
                    matchsJouesSpan.classList.add('text-red'); // Classe pour le texte rouge
                }
                if (matchsAttendus >= 2) {
                    matchsAttendusSpan.classList.add('text-orange'); // Classe pour le texte orange
                }

                // Créer le texte final et l'ajouter à la liste
                li.appendChild(checkbox);
                li.appendChild(document.createTextNode(`${nom} - Inscrit à ${heuresInscription} - `));
                li.appendChild(matchsJouesSpan);
                li.appendChild(document.createTextNode(' / '));
                li.appendChild(matchsAttendusSpan);

                // Ajout du bouton pour désinscription
                const btnDesinscrire = document.createElement('button');
                btnDesinscrire.textContent = 'Désinscrire';
                btnDesinscrire.onclick = () => {
                    const joueurRef = ref(database, 'joueurs/' + key);
                    const confirmation = confirm("Êtes-vous sûr de vouloir désinscrire ce joueur ?");
                    if (confirmation) {
                        remove(joueurRef);
                    }
                };

                li.appendChild(btnDesinscrire);
                listeJoueurs.appendChild(li);
            }
        }
    }
}

// Mettre à jour les joueurs sélectionnés
function mettreAJourJoueursSelectionnes(data) {
    joueursSelectionnes = []; // Réinitialiser la liste des joueurs sélectionnés
    for (const key in data) {
        const joueur = data[key];
        if (joueur && joueur.selectionne) {
            joueursSelectionnes.push(joueur.nom);
        }
    }
    // Vérifiez si 4 joueurs sont sélectionnés pour activer le bouton "Commencer Match"
    btnCommencer.disabled = joueursSelectionnes.length !== 4;
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

            // Réinitialiser les matchs attendus pour tous les joueurs sélectionnés
            for (const nom of joueursSelectionnes) {
                const joueurRef = ref(database, 'joueurs/' + nom);
                await update(joueurRef, { matchsAttendus: 0 }); // Reset des matchs attendus
            }
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

        const matchHistoryItemElement = document.createElement('li');
        matchHistoryItemElement.textContent = `${matchHistoryItem.date} - Terminé: ${joueursSelectionnes.join(', ')}`;
        historiqueMatchs.insertBefore(matchHistoryItemElement, historiqueMatchs.firstChild);

        // Mettre à jour les matchs joués et réinitialiser les matchs attendus
        const tousLesJoueursRef = ref(database, 'joueurs');
        const snapshot = await get(tousLesJoueursRef);
        const joueursData = snapshot.val();
        
        await Promise.all(
            Object.keys(joueursData).map(async (key) => {
                const joueur = joueursData[key];
                const joueurRef = ref(database, 'joueurs/' + key);
                
                if (joueursSelectionnes.includes(joueur.nom)) {
                    // Si le joueur a joué, incrémentez les matchs joués et réinitialisez les matchs attendus à 0
                    await update(joueurRef, { matchsJoues: (joueur.matchsJoues || 0) + 1, matchsAttendus: 0, selectionne: false });
                } else {
                    // Sinon, incrémentez les matchs attendus
                    await update(joueurRef, { matchsAttendus: (joueur.matchsAttendus || 0) + 1 });
                }
            })
        );

        // Réinitialiser l'état pour permettre un nouveau match
        messageMatch.textContent = '';
        joueursSelectionnes = [];
        btnFinir.disabled = true; // Griser le bouton

        // Supprime le match en cours de Firebase
        await remove(matchRef);

        // Récupérer à nouveau les joueurs mis à jour depuis Firebase
        const updatedSnapshot = await get(listeJoueursRef);
        const updatedJoueursData = updatedSnapshot.val();

        // Afficher les joueurs pour refléter les désélections
        afficherJoueurs(updatedJoueursData);
        
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

// Version
console.log("Version 1.5");

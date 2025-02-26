// Imports de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, push } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

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

// Références Firebase
const joueursRef = ref(database, 'joueurs');
const matchRef = ref(database, 'matchEnCours');
const historiqueMatchsRef = ref(database, 'historiqueMatchs');

// Gérer les événements de matchs
function gererMatch(joueursSelectionnes) {
    // Commencer le match
    set(matchRef, { joueurs: joueursSelectionnes });

    // Lorsque le match est fini
    async function finirMatch() {
        const matchHistoryItem = {
            date: new Date().toLocaleString(),
            joueurs: joueursSelectionnes 
        };
    
        await push(historiqueMatchsRef, matchHistoryItem); // Pousser à l'historique
    
        // Mettre à jour les matchs joués pour chaque joueur
        for (const nom of joueursSelectionnes) {
            const joueurRef = ref(database, `joueurs/${nom}`);
            const joueurSnap = await get(joueurRef);
            const joueur = joueurSnap.val();

            // Incrémenter "Joué(s)"
            await update(joueurRef, { matchsJoues: (joueur.matchsJoues || 0) + 1 });

            // Incrémenter "Attendu(s)" pour les autres joueurs
            const tousLesJoueursSnap = await get(joueursRef);
            for (const key in tousLesJoueursSnap.val()) {
                if (!joueursSelectionnes.includes(tousLesJoueursSnap.val()[key].nom)) {
                    const joueurAttenduRef = ref(database, `joueurs/${key}`);
                    await update(joueurAttenduRef, { matchsAttendus: (tousLesJoueursSnap.val()[key].matchsAttendus || 0) + 1 });
                }
            }
        }

        // Réinitialiser l'état
        await remove(matchRef);
    }

    // Attacher un événement pour finir le match
    document.getElementById('btnFinir').addEventListener('click', finirMatch);
}

// Écouter les changements sur les joueurs
onValue(joueursRef, (snapshot) => {
    const data = snapshot.val();
    afficherJoueurs(data);
});

// Afficher les joueurs
function afficherJoueurs(data) {
    const listeJoueurs = document.getElementById('listeJoueurs');
    listeJoueurs.innerHTML = '';
    if (data) {
        for (const key in data) {
            const joueur = data[key];

            const li = document.createElement('li');
            li.textContent = `${joueur.nom} - Joué(s): ${joueur.matchsJoues || 0} - Attendu(s): ${joueur.matchsAttendus || 0}`;
            listeJoueurs.appendChild(li);
        }
    }
}

// Exécution de l'application
const btnCommencer = document.getElementById('btnCommencer');
let joueursSelectionnes = []; // À remplir avec le code de sélection des joueurs

btnCommencer.addEventListener('click', () => {
    // Validation avant de commencer le match
    if (joueursSelectionnes.length === 4) {
        gererMatch(joueursSelectionnes);
    } else {
        alert("Veuillez sélectionner 4 joueurs avant de commencer le match.");
    }
});

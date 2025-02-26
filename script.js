// Imports de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, push, get, remove } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

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
            const joueur = joueurSnap.val() || { matchsJoues: 0, matchsAttendus: 0 }; // Initialiser si besoin

            // Incrémenter "Joué(s)"
            await update(joueurRef, { matchsJoues: joueur.matchsJoues + 1 });

            // Incrémenter "Attendu(s)" pour les autres joueurs
            const tousLesJoueursSnap = await get(joueursRef);
            if (tousLesJoueursSnap.exists()) {
                const tousLesJoueurs = tousLesJoueursSnap.val();
                for (const key in tousLesJoueurs) {
                    if (!joueursSelectionnes.includes(tousLesJoueurs[key].nom)) {
                        const joueurAttenduRef = ref(database, `joueurs/${key}`);
                        const joueurAttenduSnap = await get(joueurAttenduRef);
                        const joueurAttendu = joueurAttenduSnap.val() || { matchsAttendus: 0 }; // Initialiser si besoin

                        // Incrémenter "Attendu(s)"
                        await update(joueurAttenduRef, { matchsAttendus: joueurAttendu.matchsAttendus + 1 });
                    }
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
const btnInscrire = document.getElementById('btnInscrire');
const btnCommencer = document.getElementById('btnCommencer');
const btnReinitialiser = document.getElementById('btnReinitialiser');
let joueursSelectionnes = []; // Liste pour les joueurs sélectionnés

// Gérer l'inscription des joueurs
btnInscrire.addEventListener('click', () => {
    const nomJoueurInput = document.getElementById('nomJoueur');
    const nomJoueur = nomJoueurInput.value.trim();

    if (nomJoueur) {
        const joueurRef = ref(database, `joueurs/${nomJoueur}`);

        set(joueurRef, { nom: nomJoueur, matchsJoues: 0, matchsAttendus: 0 })
            .then(() => {
                console.log(`Joueur ${nomJoueur} inscrit!`);
                nomJoueurInput.value = ''; // Réinitialiser le champ
            })
            .catch((error) => {
                console.error("Erreur d'inscription: ", error);
            });
    } else {
        alert('Veuillez entrer un nom valide.');
    }
});

// Gérer la réinitialisation
btnReinitialiser.addEventListener('click', () => {
    joueursSelectionnes = [];
    document.getElementById('listeJoueurs').innerHTML = ''; // Réinitialiser la liste à afficher
    console.log("Liste de joueurs réinitialisée.");
});

// Gérer le début du match
btnCommencer.addEventListener('click', () => {
    // Validation avant de commencer le match
    if (joueursSelectionnes.length === 4) {
        gererMatch(joueursSelectionnes);
    } else {
        alert("Veuillez sélectionner 4 joueurs avant de commencer le match.");
    }
});

// Exemple de sélection des joueurs (ajoutez votre logique de sélection ici)
const selectJoueur = (nomJoueur) => {
    if (!joueursSelectionnes.includes(nomJoueur)) {
        joueursSelectionnes.push(nomJoueur);
        console.log(`${nomJoueur} sélectionné.`);
    } else {
        alert(`${nomJoueur} est déjà sélectionné.`);
    }
};

// Remplacer cette logique par des boutons dans l'interface utilisateur
// Exemple de sélection par bouton
document.querySelectorAll('.select-joueur').forEach(button => {
    button.addEventListener('click', () => {
        const nomJoueur = button.getAttribute('data-nom'); // Assurez-vous que les boutons ont cet attribut
        selectJoueur(nomJoueur);
    });
});

// Démarrer le match
btnCommencer.addEventListener('click', () => {
    if (joueursSelectionnes.length === 4) {
        const matchData = {
            date: new Date().toISOString(),
            joueurs: joueursSelectionnes,
            matchEnCours: true // Ajouter le champ pour indiquer que le match est en cours
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

            // Réinitialisation de Firebase sur l'état du match
            remove(matchRef);
            
            // Déselectionner tous les checkboxes
            const checkboxes = document.querySelectorAll('#listeJoueurs input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = false);
        })
        .catch((error) => {
            console.error("Erreur lors de l'enregistrement dans l'historique :", error);
        });
});

// Écouter les changements sur le match
onValue(matchRef, (snapshot) => {
    const matchData = snapshot.val();
    if (matchData) {
        messageMatch.textContent = `Match en cours: ${matchData.joueurs.join(', ')}`;
        joueursSelectionnes = matchData.joueurs; // Mettre à jour les joueurs sélectionnés
        setBoutonEtatMatchEnCours();
    } else {
        messageMatch.textContent = ''; // Réinitialiser si aucun match n'est en cours
        joueursSelectionnes = [];
        setBoutonEtatMatchNonEnCours();
    }
});

// Fonctions pour gérer l'état des boutons
function setBoutonEtatMatchEnCours() {
    btnFinir.disabled = false; // Activer le bouton "Finir"
    btnCommencer.disabled = true; // Désactiver le bouton "Commencer"
}

function setBoutonEtatMatchNonEnCours() {
    btnFinir.disabled = true; // Désactiver le bouton "Finir"
    btnCommencer.disabled = false; // Activer le bouton "Commencer"
}

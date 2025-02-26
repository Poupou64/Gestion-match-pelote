// Afficher les joueurs inscrits
function afficherJoueurs(data) {
    listeJoueurs.innerHTML = '';
    if (data) {
        for (const key in data) {
            const joueur = data[key];

            // Vérifiez que le joueur a un nom valide avant d'afficher
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

                    // Mettre à jour l'état du bouton "Commencer Match"
                    btnCommencer.disabled = joueursSelectionnes.length !== 4; 
                });

                // Créer des éléments séparés pour les matchs joués et attendus
                const matchsJouesSpan = document.createElement('span');
                matchsJouesSpan.textContent = `Joué(s): ${matchsJoues}`;
                const matchsAttendusSpan = document.createElement('span');
                matchsAttendusSpan.textContent = `Attendu(s): ${matchsAttendus}`;

                // Appliquer la couleur selon les matchs joués et attendus
                if (matchsJoues === 0) {
                    matchsJouesSpan.classList.add('text-red'); // Ajoute une classe pour le texte rouge
                }
                if (matchsAttendus >= 2) {
                    matchsAttendusSpan.classList.add('text-orange'); // Ajoute une classe pour le texte orange
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
                    remove(joueurRef);
                };

                li.appendChild(btnDesinscrire);
                listeJoueurs.appendChild(li);
            }
        }
    }
}

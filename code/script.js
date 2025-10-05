/*
geändert bis zur nächsten Version

*/
console.log('Schnell-Tagger Version 0.3.1; AGPL 3: https://www.gnu.org/licenses/agpl-3.0.de.html, Autor und Credit: Wolf Hosbach, http://www.wolf-hosbach.de, https://github.com/wolfhos/schnell-tagger');
//Konfiguration hier ändern
const startverzeichnis = '.'; //Muss mit dem Document Root des Webserversübereinstimmen 
const dateiHistory = "./index.html"; //Nur ändern, wenn der Dateiname nicht mehr index.html ist. Wichtig für den Back-Button des Browsers 
const sicherheitskopien = true; //Sollen Sicherheitskopien gemacht werden? Voreinstellung ist ja (true)
//const urheber: boolean = false; //Urhebereintrag in den Bildern? Siehe Readme.//Achtung funktioniert noch nicht!
///--------------------------- 
// Kern-Klassen
///---------------------------
//Die Klasse Bild mit ihren Stichwörtern
class Bild {
    constructor(name, stichworte, pfad, htmlPfad, id) {
        this._name = name;
        this._stichworte = stichworte;
        this._pfad = pfad;
        this._htmlPfad = htmlPfad;
        this._id = id;
    }
}
//Die Klasse AktuellesVerzeichnis mit Unterverzeichnissen und Bildern
class AktuellesVerzeichnis {
    constructor(name, vorherigesVerzeichnis) {
        this._name = name;
        this._unterverzeichnisse = new Array();
        this._vorherigesVerzeichnis = vorherigesVerzeichnis;
        this._bilder = new Array();
        this._bilderNurNamen = new Array();
    }
    //Methode Unterverzeichnisse und Bilder aus dem aktuellen Verzeichnis per fetch vom Server holen
    dateienVomServerHolen() {
        console.log('dateienVomServerHolen Abruf fetch: ' + this._name);
        return fetch('./verzeichnis_auslesen.php?verz=' + this._name)
            .then(response => {
            if (!response.ok) {
                throw new Error('Es gab ein Problem beim Holen der Verzeichnisinformationen vom Server: dateienVomServerHolen');
            }
            console.log('dateienVomServerHolen HTTP-Status: ' + response.status);
            return response.json();
        })
            .then(data => {
            console.log('dateienVomServerHolen Antwort fetch: ' + JSON.stringify(data));
            this.dateienSortiern(data); // Bilder von Ordnern trennen
            let bilderNurNamenUndPfad = [];
            //Nur die Bildnamen mit Pfad für die PHP-Übergabe vorbereiten
            this._bilderNurNamen.forEach((einBild) => {
                let bildMitPfad = this._name + '/' + einBild;
                bilderNurNamenUndPfad.push(bildMitPfad);
            });
            return this.stichworteHolen(bilderNurNamenUndPfad) //zu den Bildern die Stichworte holen
                .then((data3) => {
                console.log('stichworteHolen Antwort fetch: ' + JSON.stringify(data3));
                return this.bilderAufbauen(data3); // Rückgabewert von bilderAufbauen weitergeben
            })
                .then((bilder) => { return true; }); // Erfolgreicher Abschluss
        });
    }
    //Methode zum Sortieren der Dateien: wenn 'Dir' in die Liste der Unterordner, wenn 'Jpeg' in die Liste der Bildobjekte
    dateienSortiern(dateien) {
        dateien.forEach((datei, z) => {
            let endung3 = datei.substring(datei.length - 4, datei.length); //.jpeg oder .jpg
            let endung4 = datei.substring(datei.length - 5, datei.length);
            if (datei == 'dir') { //Unterordner landen hier...
                this._unterverzeichnisse.push(dateien[z + 1]);
            }
            else if (endung4 == '.jpeg' || endung4 == '.JPEG' || endung3 == '.jpg' || endung3 == '.JPG') { // ... und Jpegs hier
                this._bilderNurNamen.push(datei);
            }
        });
    }
    //Methode Stichworte zu den Bildern per fetch/POST holen
    stichworteHolen(bilderNurNamenUndPfad) {
        console.log('stichworteHolen Abfrage fetch: ' + JSON.stringify(bilderNurNamenUndPfad));
        return fetch('metalesen.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bilderNurNamenUndPfad)
        })
            .then(response => {
            if (!response.ok) {
                throw new Error('Es gab ein Problem beim Holen der Bildinformationen vom Server: stichworteHolen');
            }
            console.log('stichworteHolen HTTP-Status: ' + response.status);
            return response.json();
        })
            .then(data => { return data; });
    }
    //Methode zum Aufbauen der Bildobjekte, wenn  alle Infos vorhanden sind. Methode würde in die Bildklasse gehören, ist wegen dem Promise hier einfacher
    bilderAufbauen(bildStichwortListe) {
        let pfadOhneStartverzeichnis = this._name.replace(startverzeichnis, ''); //für die Html-Anzeige
        bildStichwortListe.forEach((fetchErgebnis, z) => {
            let bildNameOhnePfad = fetchErgebnis[0].replace(this._name, '');
            bildNameOhnePfad = bildNameOhnePfad.slice(1); //Das / als erstes Zeichen kommt noch weg
            let neues_bild = new Bild(bildNameOhnePfad, fetchErgebnis[1], this._name, pfadOhneStartverzeichnis, "bild" + z);
            this._bilder.push(neues_bild);
        });
        return Promise.resolve(this._bilder);
    }
}
///--------------------------- 
// GUI-Klassen
///---------------------------
//Klasse RahmenLinks für die Verzeichnisstruktur links
class RahmenLinks {
    constructor() {
    }
    //Methode Unterverzeichnisse links anzeigen
    unterverzeichnisseAnzeigen() {
        let htmlZumAnzeigen = '';
        if (initiierung._aktuellesVerzeichnis._name != startverzeichnis) { //Nicht im Startverzeichnis...
            htmlZumAnzeigen = '<p class=\"ordner\" id=\"back\">zurück</p>'; //... sondern überall sonst, wird die Zurück-Funktion vorgeschaltet
        }
        //HTML wird aufgebaut
        initiierung._aktuellesVerzeichnis._unterverzeichnisse.forEach((einOrdner) => {
            if (einOrdner != 'schnell-tagger_sec') //Das Sicherheitskopienverzeichnis wird nicht angezeigt
                htmlZumAnzeigen = htmlZumAnzeigen + '<p class=\"ordner\">' + einOrdner + '</p>';
        });
        //erst das aktuelle Verzeichnis fett anzeigen
        let anzeigeLinksVerzeichnis = document.getElementById("ordnerfeld"); //
        anzeigeLinksVerzeichnis.innerHTML = initiierung._aktuellesVerzeichnis._name;
        //dann die Unterverzeichnisse
        let anzeigeLinks = document.getElementById("ordnerfeldeinzeln"); //
        anzeigeLinks.innerHTML = htmlZumAnzeigen;
    }
    //Methode bei einem Verzeichniswechsel
    async verzeichnisNeuEinlesen(neuerPfad) {
        history.pushState({}, "", dateiHistory); ////Index-Datei bei jedem Verzeichniswechsel wieder in die History schreiben, damit der Back-Button neutralisiert ist
        //Die belegten Variablen löschen
        initiierung._aktuellesVerzeichnis._vorherigesVerzeichnis = initiierung._aktuellesVerzeichnis._name; //Das vorherige Verzeichnis wird auf das aktuelle gesetzt
        initiierung._aktuellesVerzeichnis._name = neuerPfad;
        initiierung._aktuellesVerzeichnis._unterverzeichnisse = [];
        initiierung._aktuellesVerzeichnis._bilder = [];
        initiierung._aktuellesVerzeichnis._bilderNurNamen = [];
        initiierung._rahmenMitte._markierteBilder = [];
        initiierung._rahmenRechts._stichworte = [];
        initiierung._rahmenRechts._stichwortNeu = '';
        initiierung._rahmenRechts._bilderNurNamen = [];
        //Unterverzeichnisse neu holen
        let ergebnis = await initiierung._aktuellesVerzeichnis.dateienVomServerHolen();
        //Ergebnisse anzeigen
        if (ergebnis) {
            initiierung._rahmenRechts.anzahlMarkiertAnzeigen(); //Die Anzahl der markierten Bilder zurücksetzen
            initiierung._rahmenLinks.unterverzeichnisseAnzeigen();
            initiierung._rahmenMitte.bilderAnzeigen();
            initiierung._rahmenRechts.stichworteAnzeigen(); //Die Stichwörter zurücksetzen
        }
    }
}
//Klasse RahmenMitte. Die Bildersammlung
class RahmenMitte {
    constructor() {
        this._markierteBilder = new Array();
    }
    //Methode Bilder anzeigen
    bilderAnzeigen() {
        let htmlZumAnzeigen = '';
        //HTML wird aufgebaut
        initiierung._aktuellesVerzeichnis._bilder.forEach((einBild) => {
            htmlZumAnzeigen = htmlZumAnzeigen + '<img src="' + einBild._htmlPfad + '/' + einBild._name + '" alt="' + einBild._name + '" class="bild"' + ' id="' + einBild._id + '">';
        });
        let anzeigeMitte = document.getElementById('bilderfeldeinzeln');
        anzeigeMitte.innerHTML = htmlZumAnzeigen;
    }
    //Methode für den  gesamten Prozess des Markierens. Dann die Stichworte jeweils an Rahmen rechts übergeben. wird vom Klick-Event ausgelöst
    bilderMarkieren(bildname) {
        //Pfadreste entfernen
        let position = bildname.length - bildname.lastIndexOf('\\') - 1;
        let nurName = bildname.slice(-position);
        position = nurName.length - nurName.lastIndexOf('/') - 1;
        nurName = nurName.slice(-position);
        nurName = nurName.trim();
        //Das angeklickte Bild wird in der Liste aller Bilder gesucht...
        const bildFund = initiierung._aktuellesVerzeichnis._bilder.find(({ _name }) => _name === nurName);
        //...und geprüft, ob es schon in der Liste der markierten Bilder ist
        const bildFund2 = this._markierteBilder.find(({ _name }) => _name === nurName);
        let bildSchonDa = false;
        if (bildFund2) {
            bildSchonDa = true;
        }
        //Fall 1, die Strg-Taste wird  gedrückt... 
        if (initiierung._strgJaNein == true) {
            if (bildFund && bildSchonDa == false) { //... und das Bild ist noch nicht in der Liste, wird es zugefügt
                this._markierteBilder.push(bildFund);
            }
            else { //Wenn Strg gedrückt und das Bild ist in der Liste, wird nur dieses gelöscht 
                this._markierteBilder = this._markierteBilder.filter(bild => bild._name !== nurName); //Bild löschen
            }
        }
        //Wenn Strg nicht gedrückt, werden alle Bilder aus der Liste gelöscht und nur dieses aufgenommen 
        else if (bildFund)
            this._markierteBilder = [bildFund];
        console.log('Markierte Bilder: ' + JSON.stringify(this._markierteBilder) + ' Anzahl: ' + this._markierteBilder.length);
        //Der rote Rahmen wird immer von allen gelöscht...
        initiierung._aktuellesVerzeichnis._bilder.forEach(element => {
            let bildElement = document.getElementById(element._id);
            bildElement.style.border = 'none';
        });
        //... nur die jeweils markierten bekommen einen
        this._markierteBilder.forEach(element => {
            let bildElement = document.getElementById(element._id);
            bildElement.style.border = '2px solid red';
        });
        initiierung._rahmenRechts.stichworteAnzeigen(); //zu den jeweils markierten Bildern die Stichworte anzeigen
    }
}
//Klasse RahmenRechts zeigt Stichwörter an und fügt neue hinzu
class RahmenRechts {
    constructor() {
        this._stichworte = new Array();
        this._stichwortNeu = '';
        this._bilderNurNamen = new Array();
        this._schreibenBlockiert = false; //Kein Schreib- oder Löschvorgang läuft
        this._stichwortZumLoeschen = '';
        this._listeZuBearbeitendeBilder = new Array();
    }
    //Methode Stichworte anzeigen
    stichworteAnzeigen() {
        this.anzahlMarkiertAnzeigen(); //Erstmal die Anzahl der markierten Bilder anzeigen
        this._stichworte = []; //Die Liste der Stichwörter
        //Stichwörter aus den markierten Bild-Objeten holn
        initiierung._rahmenMitte._markierteBilder.forEach((einBild) => {
            for (let z = 0; z < einBild._stichworte.length; z++) {
                let stichworteBild = einBild._stichworte[z];
                if (this._stichworte.indexOf(stichworteBild) == -1) { //wenn das Stichwort noch nicht in der Liste ist, kommt es ins Feld
                    this._stichworte.push(stichworteBild);
                }
            }
        });
        //Stichwortfeld wird hübsch alphabetisch sortiert...
        this._stichworte.sort(function (w1, w2) {
            return w1.localeCompare(w2);
        });
        //...und in einen HTML-String umgeleitet...
        let stichwortlisteHtml = '<ul>';
        this._stichworte.forEach(function (stichwort, z2) {
            stichwortlisteHtml = stichwortlisteHtml + "<li class='stichwortAngezeigt' id='stichwortAngezeigtID_" + stichwort + "'>" + stichwort + "</li>";
        });
        stichwortlisteHtml += '</ul>';
        //... und angezeigt
        if (stichwortlisteHtml == '')
            document.getElementById("allestichwoerter").innerHTML = "<i>Kein Stichwort vorhanden</i>";
        else
            document.getElementById("allestichwoerter").innerHTML = stichwortlisteHtml;
    }
    //Methode den Bildern ein neues Stichwort hinzufügen
    stichwortHinzufuegen() {
        this._schreibenBlockiert = true; //Go-Button wurde gedrückt. Es läuft eine Verarbeitung und andere Zugriffe werden blockiert
        this._bilderNurNamen = []; //Liste der Bildernamen für die PHP-Übergabe, wird erstmal geleert
        let bildZugefuegt = false; //Wurde ein Bild der Liste für PHP zugefügt?
        if (this._stichwortNeu == '')
            document.getElementById("nachricht_rechts").innerHTML = "<i>Bitte ein neues Stichwort eingeben</i>"; //Wenn Go ausgelöst, aber Stichwort leer
        else { //Nur wenn ein Stichwort eingegeben wurde
            //Vorbereiten für die PHP-Übergabe	
            this._bilderNurNamen.push(sicherheitskopien.toString()); //Sicherheitskopien ja/nein für die PHP-Übergabe
            //this._bilderNurNamen.push(urheber.toString()); //Urheber ja/nein
            this._bilderNurNamen.push(this._stichwortNeu); //Das neue Stichwort 
            //aus der Bilderliste werden dann die Namen geholt und zugefügt
            initiierung._rahmenMitte._markierteBilder.forEach((einBild) => {
                if (einBild._stichworte.indexOf(this._stichwortNeu) == -1) { //Das Bild wird der Liste nur zugefügt, wenn das Stichwort noch nicht da ist
                    this._bilderNurNamen.push(einBild._pfad + '/' + einBild._name);
                    this._listeZuBearbeitendeBilder.push(einBild); //Das Bild wird auch in die Liste der zu bearbeitenden Bilder aufgenommen, //damit die Aktualisierung der markierten Bilder richtig funktioniert
                    bildZugefuegt = true; //Es wurde ein Bild zugefügt
                }
            });
            console.log('metasetzen Abfrage fetch: ' + JSON.stringify(this._bilderNurNamen));
        }
        //PHP-Übergabe mit fetch/POST
        if (bildZugefuegt) { //Nur wenn Bildernamen in der Liste sind, wird die PHP-Übergabe gestartet
            document.getElementById("nachricht_rechts").innerHTML = "<i>... in Arbeit</i>"; //
            fetch('metasetzen.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this._bilderNurNamen)
            })
                .then(response => {
                if (!response.ok) {
                    throw new Error('Es gab ein Problem beim Zufügen der Stichwörter auf dem Server');
                }
                console.log('HTTP-Status metasetzen: ' + response.status);
                return response.json();
            })
                .then(data => {
                console.log('metasetzen Antwort fetch: ' + JSON.stringify(data));
                this.aktualisierenBearbeiteteBilder(); //Stichwort auch in die Bilderliste übernehmen...
                this.stichworteAnzeigen(); //... und alle Stichwörter rechts neu anzeigen
                document.getElementById("nachricht_rechts").innerHTML = "<i>fertig</i>"; //
                this._listeZuBearbeitendeBilder = []; //Die Liste der zu bearbeitenden Bilder wird wieder geleert
                this._schreibenBlockiert = false; //Schreiben wird wieder freigegeben
                return data;
            });
        }
        else {
            this._listeZuBearbeitendeBilder = []; //Die Liste der zu bearbeitenden Bilder wird geleert, auch wenn kein Bild zugefügt wurde                    
            this._schreibenBlockiert = false; //Schreiben wird freigegeben
        }
    }
    //Akualierung der Liste der makrierten Bilder mit dem neuen Stichwort
    aktualisierenBearbeiteteBilder() {
        initiierung._rahmenRechts._listeZuBearbeitendeBilder.forEach((einBild) => {
            if (einBild._stichworte.indexOf(this._stichwortNeu) == -1) { //Wenn das Stichwort noch nicht in der Liste ist, kommt es ins Feld
                einBild._stichworte.push(this._stichwortNeu);
            }
        });
    }
    //Auch nach dem Löschen wird Stichwortliste aktualisiert
    aktualisierenNachDemLoeschen() {
        initiierung._rahmenRechts._listeZuBearbeitendeBilder.forEach((einBild) => {
            const index = einBild._stichworte.indexOf(this._stichwortZumLoeschen);
            if (index !== -1)
                einBild._stichworte.splice(index, 1); // Entfernt 1 Element ab dem gefundenen Index
        });
    }
    anzahlMarkiertAnzeigen() {
        let markiertZaehler = initiierung._rahmenMitte._markierteBilder.length; //Anzahl der markierten Bilder
        let bild_oder_bilder = "Bilder";
        if (markiertZaehler == 1)
            bild_oder_bilder = "Bild";
        document.getElementById("nachricht_markiert").innerHTML = markiertZaehler + " " + bild_oder_bilder + " ausgewählt";
    }
    goButton() {
        if (initiierung._rahmenRechts._schreibenBlockiert == false) { //Nur wenn nicht schon eine Verarbeitung läuft...
            if (initiierung._rahmenMitte._markierteBilder.length != 0) { //.. und kein Bild markiert ist, wird eine Nachricht angezeigt
                document.getElementById("nachricht_rechts").innerHTML = ""; //Nachricht rechts wird wieder gelöscht
                let eingabe = document.querySelector("#eingabe"); //Das neue Stichwort
                let neues_stichwort = eingabe.value;
                initiierung._rahmenRechts._stichwortNeu = neues_stichwort;
                initiierung._rahmenRechts.stichwortHinzufuegen(); //Start der Methode Stichwort hinzufügen
            }
            else
                document.getElementById("nachricht_rechts").innerHTML = "<i>Kein Bild gewählt</i>"; //Nachricht, wenn kein Bild markiert ist
        }
        else
            document.getElementById("nachricht_rechts").innerHTML = "<i>Bitte warten: work in progress</i>"; //Falls noch eine Verarbeitung läuft
    }
    //Löschen vorbereiten
    vorbereitungLoeschen() {
        //Prüfen, ob Schreiben blockiert ist
        if (this._schreibenBlockiert == false) {
            this._schreibenBlockiert = true; //Schreiben wird blockiert
            //Liste der Bilder, aus denen das Stichwort gelöscht werden soll, aus den markierten Bildern suchen
            initiierung._rahmenMitte._markierteBilder.forEach((einBild) => {
                if (einBild._stichworte.indexOf(this._stichwortZumLoeschen) != -1) { //Das Bild wird der Liste nur zugefügt, wenn das Stichwort da ist
                    this._listeZuBearbeitendeBilder.push(einBild);
                }
            });
            console.log('Liste zu löschenden Bilder: ' + JSON.stringify(this._listeZuBearbeitendeBilder) + ' Anzahl: ' + this._listeZuBearbeitendeBilder.length);
            //Anzeigen der Sicherheitsabfrage
            let jaNeinDiv = document.getElementById("jaNein");
            jaNeinDiv.style.visibility = "visible";
            let jaNeinFrage = document.getElementById("jaNeinFrage");
            jaNeinFrage.innerHTML = "Soll das Stichwort <b>" + this._stichwortZumLoeschen + "</b> wirklich gelöscht werden?";
            let jaNeinListe = document.getElementById("jaNeinListe");
            let listeLoeschbilderHtml = this._listeZuBearbeitendeBilder.map(bild => "<br>" + bild._name);
            // ein oder mehrere Bilder?
            let loeschText1 = "folgenden";
            let loeschText2 = "folgendem";
            let loeschText3 = "Bildern:";
            let loeschText4 = "Bild:";
            if (this._listeZuBearbeitendeBilder.length == 1) { //ein Bild
                jaNeinListe.innerHTML = "Aus " + loeschText2 + " " + loeschText4 + listeLoeschbilderHtml;
            }
            else { //mehrere Bilder
                jaNeinListe.innerHTML = "Aus " + loeschText1 + " <b>" + listeLoeschbilderHtml.length + "</b> " + loeschText3 + listeLoeschbilderHtml;
            }
        }
        //Wenn Schreiben blockiert ist, wird eine entsprechende Nachricht angezeigt
        else
            document.getElementById("nachricht_rechts").innerHTML = "<i>Bitte warten: work in progress</i>";
        //Der weitere Ablauf ergibt sich, je nachdem ob der Anwender den Ja- oder Nein-Buttons klickt
    }
    //Methode für das Löschen eines Stichworts aus den markierten Bildernn
    stichwortLoeschen() {
        this._schreibenBlockiert = true; //Zugriff blockieren
        this._bilderNurNamen = []; //Liste der Bildernamen für die PHP-Übergabe, wird erstmal geleert
        let bildZugefuegt = false; //Wurde ein Bild der Liste für PHP zugefügt?
        //Vorbereiten für die PHP-Übergabe	
        this._bilderNurNamen.push(sicherheitskopien.toString()); //Sicherheitskopien ja/nein für die PHP-Übergabe
        this._bilderNurNamen.push(this._stichwortZumLoeschen); //Das Stichwort zum Löschen 
        //aus der Bilderliste werden dann die Namen geholt und zugefügt
        if (this._listeZuBearbeitendeBilder.length != 0) { //Wenn die Liste der zu löschenden Bilder nicht leer ist, wird sie in HTML umgewandelt und der Löschliste zugefügt
            initiierung._rahmenRechts._listeZuBearbeitendeBilder.forEach((einBild) => {
                this._bilderNurNamen.push(einBild._pfad + '/' + einBild._name);
                bildZugefuegt = true; //Es wurde ein Bild zugefügt
            });
        }
        console.log('loeschen Abfrage fetch: ' + JSON.stringify(this._bilderNurNamen));
        //PHP-Übergabe mit fetch/POST
        if (bildZugefuegt) { //Nur wenn Bildernamen in der Liste sind, wird die PHP-Übergabe gestartet
            document.getElementById("nachricht_rechts").innerHTML = "<i>... in Arbeit</i>"; //
            fetch('loeschen.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this._bilderNurNamen)
            })
                .then(response => {
                if (!response.ok) {
                    throw new Error('Es gab ein Problem beim Löschen der Stichwörter auf dem Server');
                }
                console.log('HTTP-Status loeschen: ' + response.status);
                return response.json();
            })
                .then(data => {
                console.log('loeschen Antwort fetch: ' + JSON.stringify(data));
                this.aktualisierenNachDemLoeschen(); //Stichwort aus der Bilderliste löschen...
                this.stichworteAnzeigen(); //... und alle Stichwörter rechts neu anzeigen
                document.getElementById("nachricht_rechts").innerHTML = "<i>fertig</i>"; //
                this._schreibenBlockiert = false; //Schreiben wird wieder freigegeben
                this._listeZuBearbeitendeBilder = []; //Die Liste der zu bearbeitenden Bilder wird wieder geleert
                this._stichwortZumLoeschen = ''; //Das zu löschende Stichwort wird wieder geleert
                return data;
            });
        }
        else {
            this._listeZuBearbeitendeBilder = []; //Die Liste der zu bearbeitenden Bilder wird geleert, auch wenn kein Bild gelöscht wurde
            this._stichwortZumLoeschen = ''; //Das zu löschende Stichwort wird wieder geleert
            this._schreibenBlockiert = false; //Schreiben wird freigegeben
        }
    }
}
///--------------------------- 
// Initiierung und Start
///---------------------------
//Klasse Initiierung
class Initiierung {
    constructor() {
        this._aktuellesVerzeichnis = new AktuellesVerzeichnis(startverzeichnis, startverzeichnis); //bei der ersten Initialisierung ist das Startverzeichnis auch das vorherige Verzeichnis
        this._rahmenLinks = new RahmenLinks();
        this._rahmenMitte = new RahmenMitte();
        this._strgJaNein = false;
        this._rahmenRechts = new RahmenRechts();
    }
    //Methode Start
    async start() {
        //Teil 1: Erste Füllung: Unterordner und Bilder vom Server holen
        //----------------
        let ergebnis = await this._aktuellesVerzeichnis.dateienVomServerHolen();
        //Ergebnisse anzeigen
        if (ergebnis) {
            this._rahmenLinks.unterverzeichnisseAnzeigen();
            this._rahmenMitte.bilderAnzeigen();
        }
        history.pushState({}, "", dateiHistory); //Index-Datei in die History schreiben, damit der Back-Button neutralisiert ist
        //Teil 2: Eventlistener hinzufügen
        //----------------
        //Listener für den Back-Button des Browsers
        window.addEventListener("popstate", (event) => {
            initiierung._rahmenLinks.verzeichnisNeuEinlesen(initiierung._aktuellesVerzeichnis._vorherigesVerzeichnis); //Bei einem Back-Button wird das vorherige Verzeichnis neu eingelesen
        });
        //Listener Abfragen der Strg-Taste
        document.addEventListener("keydown", function (event) {
            if (event.key == 'Control') {
                initiierung._strgJaNein = true;
            }
        });
        document.addEventListener("keyup", (event) => {
            if (event.key == 'Control') {
                initiierung._strgJaNein = false;
            }
        });
        //Listener: Klick auf RahmenMitte für das Markieren der Bilder 
        let listenerBilder = document.getElementById('bilderfeldeinzeln');
        listenerBilder.addEventListener('click', function (event) {
            if (event.target.attributes.src && event.target.attributes.src.value != undefined) {
                initiierung._rahmenMitte.bilderMarkieren(event.target.attributes.src.value);
            }
        });
        //Listener für den Go-Button...
        let knopf = document.getElementById("go");
        knopf.addEventListener("click", initiierung._rahmenRechts.goButton);
        //...und für die Entertaste
        document.addEventListener("keyup", (event) => {
            if (event.key === "Enter") {
                initiierung._rahmenRechts.goButton(); //Enter-Taste löst den Go-Button aus
            }
        });
        //Listener für die Verzeichnisse. Mit Klick Verzeichniswechsel
        let listenerVerzeichnisse = document.getElementById('ordnerfeldeinzeln');
        listenerVerzeichnisse.addEventListener('click', async function (event) {
            let ordnerGeklickt = event.target.innerHTML; //Der Name des Unterordners
            let neuerPfad = '';
            if (event.target.id == 'back') { //wenn Zurück geklickt wurde, wird der Pfad gekürzt
                let position = initiierung._aktuellesVerzeichnis._name.lastIndexOf('/'); //Das letzte / finden
                neuerPfad = initiierung._aktuellesVerzeichnis._name.slice(0, position); //Das neue Verzeichnis ist der Rest
            }
            else { //Andernfalls geht der Verzeichniswechsel nach unten
                neuerPfad = initiierung._aktuellesVerzeichnis._name + '/' + ordnerGeklickt; //Der neue Pfad
            }
            initiierung._rahmenLinks.verzeichnisNeuEinlesen(neuerPfad); //Funktion für den Verzeichniswechsel
        });
        //Listener für den Button Alles markieren
        let listenerAllesMarkieren = document.getElementById('schalterAlle');
        listenerAllesMarkieren.addEventListener('click', function (event) {
            initiierung._rahmenMitte._markierteBilder = initiierung._aktuellesVerzeichnis._bilder; //Alle Bilder werden markiert
            initiierung._aktuellesVerzeichnis._bilder.forEach(element => {
                let bildElement = document.getElementById(element._id);
                bildElement.style.border = '2px solid red'; //Alle werden hübsch rot umrandet...
            });
            initiierung._rahmenRechts.stichworteAnzeigen(); //.. und angezeigt
            console.log('Markierte Bilder: ' + JSON.stringify(initiierung._rahmenMitte._markierteBilder) + ' Anzahl: ' + initiierung._rahmenMitte._markierteBilder.length);
        });
        //Listener für den Button Nichts markieren
        let listenerNichtsMarkieren = document.getElementById('schalterKeins');
        listenerNichtsMarkieren.addEventListener('click', function (event) {
            initiierung._aktuellesVerzeichnis._bilder.forEach(element => {
                let bildElement = document.getElementById(element._id);
                bildElement.style.border = 'none'; //Rahmen wird entfernt
            });
            initiierung._rahmenMitte._markierteBilder = []; //Alle Bilder werden demarkiert
            initiierung._rahmenRechts.stichworteAnzeigen(); //.. und angezeigt
        });
        //Listener auf dem Eingabefeld, um es beim Klicken zu leeren
        let listenerEingabefleld = document.getElementById('eingabe');
        listenerEingabefleld.addEventListener('click', function (event) {
            listenerEingabefleld.value = ""; //Eingabefeld wird geleert, wenn es angeklickt wird
        });
        //Listner auf der Liste der Stichwörter, um ein Löschen auszulösen
        let listenerStichwoerter = document.getElementById('allestichwoerter');
        listenerStichwoerter.addEventListener('click', function (event) {
            if (initiierung._rahmenRechts._schreibenBlockiert == true) {
                console.log('Löschen blockiert, da noch eine Verarbeitung läuft');
                return;
            } //Wenn Schreiben blockiert ist, wird das Löschen nicht gestartet
            initiierung._rahmenRechts._stichwortZumLoeschen = event.target.innerText; // Das angeklickte Stichwort wird gespeichert
            console.log('Stichwort-Inhalt: ' + initiierung._rahmenRechts._stichwortZumLoeschen);
            initiierung._rahmenRechts.vorbereitungLoeschen(); //Aufruf der Ja/Nein-Abfrage zum Löschen eines Stichworts
        });
        //Listener für den Ja-Button der Löschabfrage
        let listenerJaNein = document.getElementById('jaNein');
        listenerJaNein.addEventListener('click', function (event) {
            console.log(event.target.innerText);
            if (event.target.innerText == "Ja") { //Ja  geklickt
                let jaNeinDiv = document.getElementById("jaNein");
                jaNeinDiv.style.visibility = "hidden"; //Die Ja/Nein-Abfrage wird wieder unsichtbar geschaltet
                initiierung._rahmenRechts.stichwortLoeschen(); //Das Löschen wird gestartet
            }
            else if (event.target.innerText == "Nein") { //Nein geklickt
                let jaNeinDiv = document.getElementById("jaNein");
                jaNeinDiv.style.visibility = "hidden"; //Die Ja/Nein-Abfrage wird wieder unsichtbar geschaltet
                initiierung._rahmenRechts._listeZuBearbeitendeBilder = []; //Die Liste der zu löschenden Bilder wird geleert  
                initiierung._rahmenRechts._stichwortZumLoeschen = ''; //Das zu löschende Stichwort wird gelöscht
                initiierung._rahmenRechts._schreibenBlockiert = false; //Schreiben wird wieder freigegeben
            }
        });
        //-----
    }
}
///--------------------------- 
// Start
///---------------------------
const initiierung = new Initiierung();
initiierung.start();

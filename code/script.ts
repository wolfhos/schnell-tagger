/*
geändert bis zur nächsten Version
- Eingabefeld wird geleert, wenn es angeklickt wird
- Sicherheitskopien werden nur in einem Verzeichnis gespeichert
- Verzeichnis mit Sicherheitskopien schnell-tagger_sec wird nicht mehr angezeigt

*/

console.log('Schnell-Tagger Version 0.1; AGPL 3: https://www.gnu.org/licenses/agpl-3.0.de.html, Autor und Credit: Wolf Hosbach, http://www.wolf-hosbach.de, https://github.com/wolfhos/schnell-tagger');


//Konfiguration hier ändern
const startverzeichnis: string = 'c:/web';//Muss mit dem Document Root des Webserversübereinstimmen 
const dateiHistory: string = "./index.html"; //Nur ändern, wenn der Dateiname nicht mehr index.html ist. Wichtig für den Back-Button des Browsers 
const sicherheitskopien: boolean = true; //Sollen Sicherheitskopien gemacht werden? Voreinstellung ist ja (true)
const urheber: boolean = false; //Urhebereintrag in den Bildern? Siehe Readme.//Achtung funktioniert noch nicht!


///--------------------------- 
// Kern-Klassen
///---------------------------


//Die Klasse Bild mit ihren Stichwörtern
class Bild {
    _name: string;
    _stichworte: string[];
    _pfad: string;
    _htmlPfad: string;
    _id: string;

    constructor(name: string, stichworte: string[], pfad: string, htmlPfad: string, id: string) {
        this._name = name;
        this._stichworte = stichworte;
        this._pfad = pfad;
        this._htmlPfad = htmlPfad;
        this._id = id;
    }


}


//Die Klasse AktuellesVerzeichnis mit Unterverzeichnissen und Bildern
class AktuellesVerzeichnis {
    _name: string;
    _unterverzeichnisse: string[];
    _vorherigesVerzeichnis: string;
    _bilder: Bild[];
    _bilderNurNamen: string[];


    constructor(name: string, vorherigesVerzeichnis: string) {
        this._name = name;
        this._unterverzeichnisse = new Array();
        this._vorherigesVerzeichnis = vorherigesVerzeichnis;
        this._bilder = new Array();
        this._bilderNurNamen = new Array();
    }


    //Methode Unterverzeichnisse und Bilder aus dem aktuellen Verzeichnis per fetch vom Server holen

    dateienVomServerHolen(): Promise<boolean> {
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

                let bilderNurNamenUndPfad: string[] = [];

                //Nur die Bildnamen mit Pfad für die PHP-Übergabe vorbereiten
                this._bilderNurNamen.forEach((einBild: string) => {
                    let bildMitPfad: string = this._name + '/' + einBild;
                    bilderNurNamenUndPfad.push(bildMitPfad);
                });

                return this.stichworteHolen(bilderNurNamenUndPfad) //zu den Bildern die Stichworte holen
                    .then((data3) => {
                        console.log('stichworteHolen Antwort fetch: ' + JSON.stringify(data3));
                        return this.bilderAufbauen(data3); // Rückgabewert von bilderAufbauen weitergeben
                    })
                    .then((bilder) => { return true; }); // Erfolgreicher Abschluss
            })

    }


    //Methode zum Sortieren der Dateien: wenn 'Dir' in die Liste der Unterordner, wenn 'Jpeg' in die Liste der Bildobjekte
    dateienSortiern(dateien: string[]): void {

        dateien.forEach((datei: string, z: number) => {

            let endung3: string = datei.substring(datei.length - 4, datei.length); //.jpeg oder .jpg
            let endung4: string = datei.substring(datei.length - 5, datei.length);


            if (datei == 'dir') { //Unterordner landen hier...

                this._unterverzeichnisse.push(dateien[z + 1]);
            }

            else if (endung4 == '.jpeg' || endung4 == '.JPEG' || endung3 == '.jpg' || endung3 == '.JPG') { // ... und Jpegs hier

                this._bilderNurNamen.push(datei);
            }

        });


    }

    //Methode Stichworte zu den Bildern per fetch/POST holen
    stichworteHolen(bilderNurNamenUndPfad: string[]): Promise<Bild[]> {

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
    bilderAufbauen(bildStichwortListe: Bild[]): Promise<Bild[]> {

        let pfadOhneStartverzeichnis: string = this._name.replace(startverzeichnis, '');//für die Html-Anzeige

        bildStichwortListe.forEach((fetchErgebnis: any, z: number) => {

            let bildNameOhnePfad: string = fetchErgebnis[0].replace(this._name, '');
            bildNameOhnePfad = bildNameOhnePfad.slice(1); //Das / als erstes Zeichen kommt noch weg
            let neues_bild: Bild = new Bild(bildNameOhnePfad, fetchErgebnis[1], this._name, pfadOhneStartverzeichnis, "bild" + z);
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
    unterverzeichnisseAnzeigen(): void {

        let htmlZumAnzeigen: string = '';

        if (initiierung._aktuellesVerzeichnis._name != startverzeichnis) { //Nicht im Startverzeichnis...

            htmlZumAnzeigen = '<p class=\"ordner\" id=\"back\">zurück</p>';//... sondern überall sonst, wird die Zurück-Funktion vorgeschaltet
        }


        //HTML wird aufgebaut
        initiierung._aktuellesVerzeichnis._unterverzeichnisse.forEach((einOrdner: string) => {

            console.log('Bug Ordner: ' + einOrdner);

            if (einOrdner != 'schnell-tagger_sec')  //Das Sicherheitskopienverzeichnis wird nicht angezeigt
            htmlZumAnzeigen = htmlZumAnzeigen + '<p class=\"ordner\">' + einOrdner + '</p>';

        });


        //erst das aktuelle Verzeichnis fett anzeigen
        let anzeigeLinksVerzeichnis: any = document.getElementById("ordnerfeld"); //
        anzeigeLinksVerzeichnis.innerHTML = initiierung._aktuellesVerzeichnis._name;

        //dann die Unterverzeichnisse
        let anzeigeLinks: any = document.getElementById("ordnerfeldeinzeln"); //
        anzeigeLinks.innerHTML = htmlZumAnzeigen;

    }

    //Methode bei einem Verzeichniswechsel
    async verzeichnisNeuEinlesen(neuerPfad: string): Promise<void> {

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
        }


    }

}


//Klasse RahmenMitte. Die Bildersammlung

class RahmenMitte {

    _markierteBilder: Bild[];

    constructor() {

        this._markierteBilder = new Array();
    }

    //Methode Bilder anzeigen
    bilderAnzeigen(): void {

        let htmlZumAnzeigen: string = '';

        //HTML wird aufgebaut
        initiierung._aktuellesVerzeichnis._bilder.forEach((einBild: Bild) => {

            htmlZumAnzeigen = htmlZumAnzeigen + '<img src="' + einBild._htmlPfad + '/' + einBild._name + '" alt="' + einBild._name + '" class="bild"' + ' id="' + einBild._id + '">';

        });


        let anzeigeMitte: any = document.getElementById('bilderfeldeinzeln');
        anzeigeMitte.innerHTML = htmlZumAnzeigen;

    }

    //Methode für den  gesamten Prozess des Markierens. Dann die Stichworte jeweils an Rahmen rechts übergeben. wird vom Klick-Event ausgelöst
    bilderMarkieren(bildname: string) {

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
        let bildSchonDa: boolean = false;
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
        else if (bildFund) this._markierteBilder = [bildFund];



        console.log('Markierte Bilder: ' + JSON.stringify(this._markierteBilder) + ' Anzahl: ' + this._markierteBilder.length);



        //Der rote Rahmen wird immer von allen gelöscht...
        initiierung._aktuellesVerzeichnis._bilder.forEach(element => {
            let bildElement: any = document.getElementById(element._id);
            bildElement.style.border = 'none';
        });

        //... nur die jeweils markierten bekommen einen
        this._markierteBilder.forEach(element => {

            let bildElement: any = document.getElementById(element._id);
            bildElement.style.border = '2px solid red';

        });

        initiierung._rahmenRechts.stichworteAnzeigen();//zu den jeweils markierten Bildern die Stichworte anzeigen


    }
}

//Klasse RahmenRechts zeigt Stichwörter an und fügt neue hinzu
class RahmenRechts {

    _stichworte: string[];
    _stichwortNeu: string;
    _bilderNurNamen: string[];
    _goAusgeloest: boolean;

    constructor() {

        this._stichworte = new Array();
        this._stichwortNeu = '';
        this._bilderNurNamen = new Array();
        this._goAusgeloest = false; //Go-Button wurde noch nicht gedrückt
    }

    //Methode Stichworte anzeigen
    stichworteAnzeigen(): void {

        this.anzahlMarkiertAnzeigen(); //Erstmal die Anzahl der markierten Bilder anzeigen

        this._stichworte = []; //Die Liste der Stichwörter

        //Stichwörter aus den markierten Bild-Objeten holn
        initiierung._rahmenMitte._markierteBilder.forEach((einBild: Bild) => {

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
        let stichwortlisteHtml: string = '';

        this._stichworte.forEach(function (stichwort: string, z2: number) {


            stichwortlisteHtml = stichwortlisteHtml + stichwort + "<br>";

        });

        //... und angezeigt
        if (stichwortlisteHtml == '') document.getElementById("allestichwoerter")!.innerHTML = "<i>Kein Stichwort vorhanden</i>";
        else document.getElementById("allestichwoerter")!.innerHTML = stichwortlisteHtml;

    }

    //Methode den Bildern ein neues Stichwort hinzufügen
    stichwortHinzufuegen(): void {

        this._goAusgeloest = true; //Go-Button wurde gedrückt
        this._bilderNurNamen = []; //Liste der Bildernamen für die PHP-Übergabe, wird erstmal geleert

        let bildZugefuegt: boolean = false; //Wurde ein Bild der Liste für PHP zugefügt?

        if (this._stichwortNeu == '') document.getElementById("nachricht_rechts")!.innerHTML = "<i>Bitte ein neues Stichwort eingeben</i>";//Wenn Go ausgelöst, aber Stichwort leer

        else { //Nur wenn ein Stichwort eingegeben wurde

            //Vorbereiten für die PHP-Übergabe	
            this._bilderNurNamen.push(sicherheitskopien.toString()); //Sicherheitskopien ja/nein für die PHP-Übergabe
            this._bilderNurNamen.push(urheber.toString()); //Urheber ja/nein

            this._bilderNurNamen.push(this._stichwortNeu); //Das neue Stichwort 

            //aus der Bilderliste werden dann die Namen geholt und zugefügt

            initiierung._rahmenMitte._markierteBilder.forEach((einBild: Bild) => {

                if (einBild._stichworte.indexOf(this._stichwortNeu) == -1) { //Das Bild wird der Liste nur zugefügt, wenn das Stichwort noch nicht da ist
                    this._bilderNurNamen.push(einBild._pfad + '/' + einBild._name);

                    bildZugefuegt = true; //Es wurde ein Bild zugefügt

                }

            });

            console.log('metasetzen Abfrage fetch: ' + JSON.stringify(this._bilderNurNamen));

        }


        //PHP-Übergabe mit fetch/POST
        if (bildZugefuegt) { //Nur wenn Bildernamen in der Liste sind, wird die PHP-Übergabe gestartet

            document.getElementById("nachricht_rechts")!.innerHTML = "<i>... in Arbeit</i>";//
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

                    this.aktualisierenMarkierteBilder();//Stichwort auch in die Bilderliste übernehmen...
                    this.stichworteAnzeigen(); //... und alle Stichwörter rechts neu anzeigen
                    document.getElementById("nachricht_rechts")!.innerHTML = "<i>fertig</i>";//
                    this._goAusgeloest = false; //Go-Button wird wieder auf nicht gedrückt gesetzt

                    return data;
                });

        }
        else this._goAusgeloest = false; //Go-Button wird zurückgesetzt, auch wenn kein Bild zugefügt wurde

    }

    //Akualierung der Liste der makrierten Bilder mit dem neuen Stichwort
    aktualisierenMarkierteBilder(): void {

        initiierung._rahmenMitte._markierteBilder.forEach((einBild: Bild) => {


            if (einBild._stichworte.indexOf(this._stichwortNeu) == -1) { //Wenn das Stichwort noch nicht in der Liste ist, kommt es ins Feld

                //console.log('Stichworte im Bild ' + einBild._stichworte)

                einBild._stichworte.push(this._stichwortNeu);

            }

        });

    }

    anzahlMarkiertAnzeigen(): void { //Anzahl der markierten Bilder rechts oben anzeigen

        let markiertZaehler: number = initiierung._rahmenMitte._markierteBilder.length; //Anzahl der markierten Bilder
        let bild_oder_bilder: string = "Bilder";
        if (markiertZaehler == 1) bild_oder_bilder = "Bild";
        document.getElementById("nachricht_markiert")!.innerHTML = markiertZaehler + " " + bild_oder_bilder + " ausgewählt";
    }

    goButton(): void {


        if (initiierung._rahmenRechts._goAusgeloest == false) { //Nur wenn nicht schon eine Verarbeitung läuft...

            if (initiierung._rahmenMitte._markierteBilder.length != 0) { //.. und kein Bild markiert ist, wird eine Nachricht angezeigt

                document.getElementById("nachricht_rechts")!.innerHTML = "";//Nachricht rechts wird wieder gelöscht
                let eingabe: any = document.querySelector("#eingabe"); //Das neue Stichwort
                let neues_stichwort: string = eingabe.value;
                initiierung._rahmenRechts._stichwortNeu = neues_stichwort;
                initiierung._rahmenRechts.stichwortHinzufuegen(); //Start der Methode Stichwort hinzufügen
            }
            else document.getElementById("nachricht_rechts")!.innerHTML = "<i>Kein Bild gewählt</i>"; //Nachricht, wenn kein Bild markiert ist


        }

        else document.getElementById("nachricht_rechts")!.innerHTML = "<i>Bitte warten: work in progress</i>";//Falls noch eine Verarbeitung läuft


    }

}


///--------------------------- 
// GUI-Klassen
///---------------------------

//Klasse Initiierung
class Initiierung {

    _aktuellesVerzeichnis: AktuellesVerzeichnis;
    _rahmenLinks: RahmenLinks;
    _rahmenMitte: RahmenMitte;
    _rahmenRechts: RahmenRechts;
    _strgJaNein: boolean;

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
        window.addEventListener("popstate", (event : any) => {


            initiierung._rahmenLinks.verzeichnisNeuEinlesen(initiierung._aktuellesVerzeichnis._vorherigesVerzeichnis); //Bei einem Back-Button wird das vorherige Verzeichnis neu eingelesen

        });



        //Listener Abfragen der Strg-Taste
        document.addEventListener("keydown", function (event : any) {

            if (event.key == 'Control') {
                initiierung._strgJaNein = true;
            }


        });
        document.addEventListener("keyup", (event : any) => {


            if (event.key == 'Control') {
                initiierung._strgJaNein = false;
            }


        });


        //Listener: Klick auf RahmenMitte für das Markieren der Bilder 
        let listenerBilder: any = document.getElementById('bilderfeldeinzeln');

        listenerBilder.addEventListener('click', function (event : any) {


            if (event.target.attributes.src && event.target.attributes.src.value != undefined) {

                initiierung._rahmenMitte.bilderMarkieren(event.target.attributes.src.value);
            }

        });


        //Listener für den Go-Button...
        let knopf: any = document.getElementById("go");
        knopf.addEventListener("click", initiierung._rahmenRechts.goButton);

        //...und für die Entertaste
        document.addEventListener("keyup", (event : any) => {
            if (event.key === "Enter") {

                initiierung._rahmenRechts.goButton(); //Enter-Taste löst den Go-Button aus
            }

        });


        //Listener für die Verzeichnisse. Mit Klick Verzeichniswechsel
        let listenerVerzeichnisse: any = document.getElementById('ordnerfeldeinzeln');
        listenerVerzeichnisse.addEventListener('click', async function (event : any) {

            let ordnerGeklickt: string = event.target.innerHTML; //Der Name des Unterordners
            let neuerPfad: string = '';

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
        let listenerAllesMarkieren: any = document.getElementById('schalterAlle');
        listenerAllesMarkieren.addEventListener('click', function (event : any) {


            initiierung._rahmenMitte._markierteBilder = initiierung._aktuellesVerzeichnis._bilder; //Alle Bilder werden markiert
            initiierung._aktuellesVerzeichnis._bilder.forEach(element => {
                let bildElement: any = document.getElementById(element._id);
                bildElement.style.border = '2px solid red'; //Alle werden hübsch rot umrandet...
            });


            initiierung._rahmenRechts.stichworteAnzeigen(); //.. und angezeigt

            console.log('Markierte Bilder: ' + JSON.stringify(initiierung._rahmenMitte._markierteBilder) + ' Anzahl: ' + initiierung._rahmenMitte._markierteBilder.length);


        });

        //Listener für den Button Nichts markieren
        let listenerNichtsMarkieren: any = document.getElementById('schalterKeins');
        listenerNichtsMarkieren.addEventListener('click', function (event : any) {

            initiierung._aktuellesVerzeichnis._bilder.forEach(element => {
                let bildElement: any = document.getElementById(element._id);
                bildElement.style.border = 'none'; //Rahmen wird entfernt
            });
            initiierung._rahmenMitte._markierteBilder = []; //Alle Bilder werden demarkiert
            initiierung._rahmenRechts.stichworteAnzeigen(); //.. und angezeigt

        });

        let listenerEingabefleld: any = document.getElementById('eingabe');

        listenerEingabefleld.addEventListener('click', function (event : any) {


            listenerEingabefleld.value = ""; //Eingabefeld wird geleert, wenn es angeklickt wird


        });




    }
}



///--------------------------- 
// Start
///---------------------------

const initiierung = new Initiierung();
initiierung.start();
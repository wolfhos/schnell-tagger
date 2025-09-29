<?php

//Skript fügt das neue Stichwort den IPTC-Daten der Bilder hinzu
//---------------------------------------------------------------

error_reporting(0); //Fehlermeldungen abschalten

//Konfiguration Urheber. Sollte einmal in die TS-Datei 
$urheber = "Wolf Hosbach, www.wolf-hosbach.de";

//Übergabe POST
$uebergabeJson = file_get_contents("php://input");
$uebergabeOhnehtml = html_entity_decode($uebergabeJson, ENT_QUOTES, "UTF-8"); //Falls sich HTML eingeschlichen hat.
$uebergabe = json_decode($uebergabeOhnehtml, true);

// bug $uebergabe = ["true","false","o3","C:/schnell-tagger2/code/Clipboard 1.jpg"];

//Die Übergabe wird zerlegt
foreach ($uebergabe as $z => $element) {

    switch ($z) {
        case 1: //Urheber Ja Nein?
            $urheberJaNein = $element;
            break;
        case 0: //Sicherheitskopie Ja Nein?
            $sicherheitskopieJaNein = $element;
            break;
        case 2: //Das neue Stichwort
            $neuesStichwort = $element;
            break;
        default: //Die Liste der Bildnamen
            $bildNamen[] = $element;
            break;
    }
}



//wenn Sicherheitskopien gewünscht sind, wird ein entsprechendes Verzeichnis erstellt
if ($sicherheitskopieJaNein == "true") {

    $verzeichnisname = ".\schnell-tagger_sec";
    if (!file_exists($verzeichnisname)) mkdir($verzeichnisname);
    
    //für die Namenserweiterung der Kopien mit Datum, Uhrzeit und Zufallszahl
    $zeit = time();
    $namenserweiterung = date("Ymd_His", $zeit) . "_" . rand(1, 100000); 
    
    
    //Jede Datei wird kopiert
    foreach ($bildNamen as $bild) {

        $quelle = $bild;
        $ziel = $verzeichnisname . "\\" . basename($bild) . "_$namenserweiterung" ;
        copy($quelle, $ziel);
    }
}


/////---------------Die Hauptfunktion: Neue Stichwörter und ggf. Urheber für jede Datei zufügen


foreach ($bildNamen as $z2 => $bild) {

    //Den vorhandenen IPTC-Header auslesen
    $getSizeAlles = getimagesize($bild, $getSizeIPTC); //getimagesize liefert mit dem zweiten Parameter ($info) die IPTC-Daten
    if (isset($getSizeIPTC["APP13"])) {

        $iptcOriginal = iptcparse($getSizeIPTC["APP13"]);
    }

    //Wenn kein IPTC-Header vorhanden ist, wird ein leerer angelegt
    $laengeStichwortfeld = 0;
    if (isset($iptcOriginal["2#025"])) $laengeStichwortfeld = count($iptcOriginal["2#025"]);

    else {

        //Wir erzeugen einen leeren Headerm 
        $binleer = chr(0) . chr(2);

        $lange = strlen($binleer);
        $binaeretagleer = chr(0x1c) . chr(2) . chr(0) . chr($lange >> 8) . chr($lange & 0xff) . $binleer; //$binaeretags wird etwas länger

        $leer = iptcembed($binaeretagleer, $bild, 0);
        $datei = fopen($bild, "w");
        fwrite($datei, $leer);
        fclose($datei);


        //Dem leeren Header wird ein neues Array mit dem  neuen Stichwort zugewiesen (Feld 2#025)
        $iptcOriginal["2#025"][$laengeStichwortfeld] = $neuesStichwort;
    }

    //Das Stichwort-Array des Headers bekommt das neue Stichwort, wenn dieses nicht schon vorhanden ist (Feld 2#025)
    if (in_array($neuesStichwort, $iptcOriginal["2#025"]) == false)  $iptcOriginal["2#025"][$laengeStichwortfeld] = $neuesStichwort;


    ///Urheber irgendwie so: 
    ///Wir ersetzen den Copyright-Hinweis (Feld 2#116. Der alte wird gelöscht) $iptc_orig["2#116"][0] = $urheber;


    ///Nun folgt die Erzeugung des neuen binären Codes zum Einbetten in die Bilddatei
    //---------------------------------------------------------------

    //Der erste Teils des binäre Codes ($binaeretags) für den UTF-8-Zeichencode im Abschnitt 1#090 
    $utf8abschnitt = chr(0x1b) . chr(0x25) . chr(0x47); //ESC % G 
    $lange = strlen($utf8abschnitt);
    $binaeretags = chr(0x1C) . chr(1) . chr('090') . chr($lange >> 8) . chr($lange & 0xFF) . $utf8abschnitt;


    ////Der zweite Teils des binäre Codes ($binaeretags) für die neuen Tags in 2#025 
    $abschnitt  = 2;
    $unterabschnitt = 25;
    if (is_array($iptcOriginal["2#025"])) {

        foreach ($iptcOriginal["2#025"] as $i1) {
            $lange = strlen($i1);
            $binaeretags .= chr(0x1c) . chr($abschnitt) . chr($unterabschnitt) . chr($lange >> 8) . chr($lange & 0xff) . $i1; //$binaeretags wird etwas länger
        }
    }

/*
    ////Der dritte  Teils des binäre Codes ($binaeretags) für den Urheber in 2#116 
    $abschnitt  = 2;
    $unterabschnitt = 116;
    if (is_array($iptc_orig["2#116"])) {

        foreach ($iptc_orig["2#116"] as $i3) {
            $lang = strlen($i3);
            $binaeretags .= chr(0x1c) . chr($abschnitt) . chr($unterabschnitt) . chr($lang >> 8) . chr($lang & 0xff) . $i3; //$binaeretags wird etwas länger
        }
    }
    */



    /// Der so entstandene binäre Code wird in das Bild im IPTC-Abschnitt eingefügt. Für iptcembed gibt es drei Modi: 

    // Modus 0 - Das neue Bild wird in die Variable ($bildmittagsneu) eingefügt
    // Modus 1 - ... in die Variable eingefügt und dem Web-Client übergeben
    // Modus 2 - ... nur dem Web-Client übergeben
    $modus = 0;


    $bildMitNeuenTags = iptcembed($binaeretags, $bild, $modus); //Rückgabe: Ein Bild mit den neuen Tags


    //Nun schreiben wir das neue Bild in eine neue Datei
    $datei = fopen($bild, "w");
    $writeist = fwrite($datei, $bildMitNeuenTags);
    fclose($datei);
}

$status[] = "ok"; //Statusmeldung

echo json_encode($status); 



//Schnell-Tagger Version 0.1; AGPL 3: https://www.gnu.org/licenses/agpl-3.0.de.html, Autor und Credit: Wolf Hosbach, http://www.wolf-hosbach.de, https://github.com/wolfhos/schnell-tagger'

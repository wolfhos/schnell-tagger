<?php

error_reporting(0); //Fehlermeldungen abschalten

//Übergabe POST aus dem JavaScript
$uebergabeJson = file_get_contents("php://input");
$uebergabeOhnehtml = html_entity_decode($uebergabeJson, ENT_QUOTES, "UTF-8"); //Falls sich HTML eingeschlichen hat.
$uebergabe = json_decode($uebergabeOhnehtml, true);


//$uebergabe = ["true", "Kyra", "c:/web/schnell-tagger/code/testbilder/2501 Winter/DSC_2256.jpg", "c:/web/schnell-tagger/code/testbilder/2501 Winter/DSC_2261.jpg"]; //Bug


//Die Übergabe wird zerlegt
foreach ($uebergabe as $z => $element) {

    switch ($z) {
        case 0: //Sicherheitskopie Ja Nein?
            $sicherheitskopieJaNein = $element;
            break;
        case 1: //Das neue Stichwort
            $stichwortZumLoeschen = $element;
            break;
        default: //Die Liste der Bildnamen
            $bildNamen[] = $element;
            break;
    }
}


//wenn Sicherheitskopien gewünscht sind, wird ein entsprechendes Verzeichnis erstellt
if ($sicherheitskopieJaNein == "true") {

    $verzeichnisname = ".\schnell-tagger_sec";
    if (!file_exists($verzeichnisname))
        mkdir($verzeichnisname);

    //für die Namenserweiterung der Kopien mit Datum, Uhrzeit und Zufallszahl
    $zeit = time();
    $namenserweiterung = "Schnell-Taggger-sec_" . date("Ymd_His", $zeit) . "_" . rand(1, 100000) . "_";


    //Jede Datei wird kopiert
    foreach ($bildNamen as $bild) {

        $quelle = $bild;
        $ziel = $verzeichnisname . "\\" . "$namenserweiterung" . basename($bild);
        copy($quelle, $ziel);
    }
}


/////---------------Die Hauptfunktion: Das Stichwort aus jeder Datei löschen





//Die Felder werden nun Bild für Bild zugefügt
foreach ($bildNamen as $z2 => $bild) {


    //Den vorhandenen IPTC-Header auslesen
    $getSizeAuslesen = getimagesize($bild, $getIPTC); //getimagesize liefert mit dem zweiten Parameter ($getIPTC) die IPTC-Daten
    if (isset($getIPTC["APP13"])) {

        $iptcOriginal = iptcparse($getIPTC["APP13"]);
    }

    //echo "Vorhandene IPTC-Felder: $bild<br>";
    //var_dump($iptcOriginal);

    //Variable für den binären Code, der in die Bilddatei eingebettet wird. Hier noch leer
    $zumEinbetten = "";


    $feldNeu = [];

    foreach ($iptcOriginal as $i => $einiptc) {

        if ($i == "2#025") {

            //var_dump($einiptc);
            //echo "<br>";


            $feldNeu = array_diff($einiptc, [$stichwortZumLoeschen]);

            //var_dump($feldNeu);
            //echo "<br>";

        }


    }


    //if ($feldNeu != []) {

    //Nun wird der binäre Code zum Einbetten in die Bilddatei erzeugt

    $abschnitt = 2; //Die 2 von 2#025
    $unterabschnitt = 25; //Die 25 von 2#025

    //binäre Magic
    foreach ($feldNeu as $i1) {
        //echo "i1: $i1<br>";
        $laenge = strlen($i1);
        $zumEinbetten .= chr(0x1c) . chr($abschnitt) . chr($unterabschnitt) . chr($laenge >> 8) . chr($laenge & 0xff) . $i1; //
    }

    //echo "Binär zum Einbetten: <br>";
    //echo $zumEinbetten;






/// Der  binäre Code wird in das Bild im IPTC-Abschnitt eingefügt. Für iptcembed gibt es drei Modi: 

// Modus 0 - Das neue Bild mit den neuen Feldern wird in die Variable ($bildMitTagsNeu) eingefügt
// Modus 1 - ... in die Variable eingefügt und dem Web-Client übergeben
// Modus 2 - ... nur dem Web-Client übergeben
///*
    $modus = 0;


    $bildMitNeuenTags = iptcembed($zumEinbetten, $bild, $modus); //Rückgabe: Ein Bild mit den neuen Tags


    //Nun schreiben wir das neue Bild in eine neue Datei gleichen Namens
    $datei = fopen($bild, "w");
    $writeist = fwrite($datei, $bildMitNeuenTags);
    fclose($datei);





//*/

}
$status[] = "ok"; //Statusmeldung

echo json_encode($status);



//Schnell-Tagger Version 0.2; AGPL 3: https://www.gnu.org/licenses/agpl-3.0.de.html, Autor und Credit: Wolf Hosbach, http://www.wolf-hosbach.de, https://github.com/wolfhos/schnell-tagger'
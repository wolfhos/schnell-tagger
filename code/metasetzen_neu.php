<?php

//Skript fügt das neue Stichwort den IPTC-Daten der Bilder hinzu
//---------------------------------------------------------------

// error_reporting(0); //Fehlermeldungen abschalten

$uebergabe = ["true", "false", "Test ganz neu", "e:/web/schnell-tagger/code/testbilder/2501 Winter/DSC_2256.jpg", "e:/web/schnell-tagger/code/testbilder/2501 Winter/DSC_2261.jpg", "e:/web/schnell-tagger/code/testbilder/2501 Winter/Clipboard 1.jpg" , "e:/web/schnell-tagger/code/testbilder/2501 Winter/Blenderman_Paul.JPG"];

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


//Die Liste aller möblichen IPTC-Felder laut https://de.wikipedia.org/wiki/IPTC-IIM-Standard

echo "Alle möglichen IPTC-Felder:<br>";
$alleFelder = array("1#020", "1#090", "2#005", "2#007", "2#010", "2#015", "2#020", "2#025", "2#040", "2#055", "2#060", "2#062", "2#063", "2#065", "2#080", "2#085", "2#090", "2#092", "2#095", "2#100", "2#101", "2#103", "2#105", "2#110", "2#115", "2#116", "2#118", "2#120", "2#122");

var_dump($alleFelder);

echo "<br><br>";
echo "Die IPTC-Felder aus der  INI-Datei:<br>";

//Die Felder aus der INI-Datei werden ausgelesen 
$ini_array = parse_ini_file("Felder.ini", true);
var_dump($ini_array);

echo "<br><br>";

foreach ($bildNamen as $z2 => $bild) {


    echo "<br><br><b>Bild</b> $z2: $bild<br>";
    //Den vorhandenen IPTC-Header auslesen
    $getSizeAuslesen = getimagesize($bild, $getSizeIPTC); //getimagesize liefert mit dem zweiten Parameter ($info) die IPTC-Daten
    if (isset($getSizeIPTC["APP13"])) {

        $iptcOriginal = iptcparse($getSizeIPTC["APP13"]);
    }



    echo "<br><br>";
    echo "Felder aus dem Header der ersten Datei:<br>";
    var_dump($iptcOriginal);

    echo "<br><br>";

    $zumEinbetten = "";

    //Durchlauf durch alle Felder
    foreach ($alleFelder as $feld) {

        $feldNeu = [];

        //Überprüfung, ob das Feld in der INI-Datei vorkommt
        if (isset($ini_array["IPTC-Felder"][$feld]) && $feld != "2#025") {



            echo "<br>Feld $feld ist in der INI-Datei<br>";

            //Sonderfall UTF-8
            if ($feld == "1#090" && $ini_array["IPTC-Felder"][$feld] == "true") {
                $feldNeu[] = chr(0x1b) . chr(0x25) . chr(0x47); //ESC % G;
                echo "<br>Sonderfall UTF-8<br>";

            } /*elseif ($feld == "2#025") {

                echo "<br><b>2#25</b><br>";
                $feldNeu[] = "";

            }*/
            else   $feldNeu[] = $ini_array["IPTC-Felder"][$feld];
            






        } else {

            // echo "<br>Feld $feld ist NICHT in der INI-Datei<br>";

            //Überprüfung, ob das Feld im Header der ersten Datei vorkommt
            if (isset($iptcOriginal[$feld])) {

                echo "Feld $feld ist im Header der ersten Datei vorhanden<br>";
                echo "Wert: ";
                var_dump($iptcOriginal[$feld]);

                //Sonderfall UTF-8
                if ($feld == "1#090" && $ini_array["IPTC-Felder"][$feld] == "true") {
                    $feldNeu[] = chr(0x1b) . chr(0x25) . chr(0x47); //ESC % G;
                    echo "<br>Sonderfall UTF-8<br>";

                } else
                    $feldNeu = $iptcOriginal[$feld]; //Der erste Wert wird übernommen, wenn das Feld in der INI-Datei nicht vorkommt

            } else {

                //echo "Feld $feld ist im Header der ersten Datei NICHT vorhanden<br>";
            }

        }

        //Sonderfall Stichwort 2#025
        if ($feld == "2#025") {
            //Das Stichwort-Array des Headers bekommt das neue Stichwort, wenn dieses nicht schon vorhanden ist (Feld 2#025)
            if (in_array($neuesStichwort, $feldNeu) == false)
                $feldNeu[] = $neuesStichwort;


        }

        if ($feldNeu != []) {
            echo "<br>Neuer Wert für Feld<br>";
            var_dump($feldNeu);
            echo "<br>";

            //Nun wird der binäre Code zum Einbetten in die Bilddatei erzeugt

            $abschnitt = (int) substr($feld, 0, 1);
            $unterabschnitt = (int) substr($feld, 2, 3);

            echo "<br>Abschnitt: $abschnitt Unterabschnitt: $unterabschnitt<br>";

            foreach ($feldNeu as $i1) {
                $laenge = strlen($i1);
                $zumEinbetten .= chr(0x1c) . chr($abschnitt) . chr($unterabschnitt) . chr($laenge >> 8) . chr($laenge & 0xff) . $i1; //
            }
        }



    }

    echo "<br>Zum Einbetten: $zumEinbetten<br>";


    $modus = 0;


    $bildMitNeuenTags = iptcembed($zumEinbetten, $bild, $modus); //Rückgabe: Ein Bild mit den neuen Tags


    //Nun schreiben wir das neue Bild in eine neue Datei
    $datei = fopen($bild, "w");
    $writeist = fwrite($datei, $bildMitNeuenTags);
    fclose($datei);
}





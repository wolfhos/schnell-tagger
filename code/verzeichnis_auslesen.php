<?php 

//Schnell-Tagger Version 0.3.2; AGPL 3: https://www.gnu.org/licenses/agpl-3.0.de.html, Autor und Credit: Wolf Hosbach, http://www.wolf-hosbach.de, https://github.com/wolfhos/schnell-tagger'


/*###############################################################################
Die Funktion für fetch liest alle JPG-Dateien und Unterverzeichnisse in einem Verzeichnis

#############################################################
*/


error_reporting(0); //Fehlermeldungen abschalten

//Das übergebene Verzeichnis
//bug: $pfad = "C:/Users/Public/Pictures/2019/1902 Tiefschneekurs/";
$pfad = filter_var($_GET["verz"], FILTER_UNSAFE_RAW);

$pfadsammlung = array();



//Gibt es das Verzeichnis?
if ($handle = opendir($pfad)) { 

    //Datei für Datei
    while (false !== ($eintrag = readdir($handle))) {

        $eintragmitpfad = $pfad . "/" . $eintrag;
    
        $typ = filetype($eintragmitpfad);
        if ($eintrag != (".") & $eintrag != (".." )) { 

            //Typ und Datei werden im Feld gespeichert
            $pfadsammlung[] = $typ;
            $pfadsammlung[] = $eintrag;

        }
    
        
    }

    closedir($handle);
}


//Wir wanldeln das Feld in einen JSON-String und geben ihn über Ajax aus
$jshoh = json_encode($pfadsammlung);
echo $jshoh;

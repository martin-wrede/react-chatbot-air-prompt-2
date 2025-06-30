import React, {useState, useContext} from "react";
import {Context} from "../Context";

export default function Form(props){
      const  [ age , setAge ] = useState(0)
      const [sex, setSex] =  useState("")
      const [country, setCountry ] = useState("Deutschland")
      const [promptInfo, setPromptInfo] = useState({
           
        problem: "",
        solution: "",
        result: "",
        period: "", 
        startDate: "", 
        dailyStartTime: "", 
        dailyHours: "", 
        industry: ""
    }
    )

      const [gesamtPrompt, setGesamtPrompt] = useState("")
       const { data } = useContext(Context);

const handleSubmit = (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);

  setPromptInfo({
  problem: formData.get("problem"),
    solution: formData.get("solution"),
    result: formData.get("result"),
    period: formData.get("period"),
    startDate: formData.get("startDate"),
    dailyStartTime: formData.get("dailyStartTime"),
    dailyHours: formData.get("dailyHours"),
    industry: formData.get("industry"),
  });

  let AIRole = `
Du bist ein erfahrener Projektmanager.

Deine Aufgabe besteht aus zwei Schritten:

1. Du analysierst das gegebene Ziel, das der Benutzer dir nennt, und gibst eine vollständige Liste aller notwendigen Aufgaben aus, die erledigt werden müssen, um dieses Ziel zu erreichen.

2. Danach wandelst du diese Aufgaben in ein Google-Kalender-kompatibles Format (.ics) um. Für jeden Task legst du fest:
– Den Starttermin (beginnend am nächsten Werktag, also ohne Samstag/Sonntag),
– Eine Anfangszeit (z. B. 09:00 Uhr),
– Eine Dauer (z. B. 2 Stunden).

Du erzeugst daraus einen vollständigen .ics-Kalendertext, der vom Benutzer in Google Calendar importiert werden kann.

Antwortformat:
Zuerst gibst du die Aufgabenliste in Klartext aus (stichpunktartig oder nummeriert).  
Dann folgt der Kalender-Inhalt im .ics-Format, eingerahmt von den Tags \`\`\`ics und \`\`\`.

Beispiel:
\`\`\`ics
BEGIN:VCALENDAR
...
END:VCALENDAR
\`\`\`

Beginne erst mit deiner Analyse, wenn der Benutzer sein Ziel, Lösung und Zeitraum eingegeben hat.
`;



let prompt = "1. Mein Problem, was ich lösen möchte ist: " + formData.get("problem")
 + " // 2. Die Lösung, die ich aktuell sehe ist: " + formData.get("solution")
 +  " // 3. Ich sehe das Ergebnis in der Form von: " + formData.get("result")
 +  " // 4. Der Zeitraum den ich einplane ist in Monaten: " + formData.get("period")
  +  " // 5. Der Projektstart ist am: " + formData.get("startDate")
    +  " // 6. Tägliche Anfangszeit : " + formData.get("dailyStartTime")
  +  " // 7. Tägliche Arbeitszeit: " + formData.get("dailyHours")
 +  " // 8. Die Industrie oder Nische ist: " + formData.get("industry");




const fullPrompt = AIRole + "\n\n" + prompt;

 console.log(fullPrompt);

props.onPromptChange(fullPrompt);

};

   
    return(
        <div>
            Persönliche Daten: (fließen aktuell nicht in den Prompt mit ein)
     <br />     <br />

 <form onSubmit={handleSubmit}>
    
Alter
<br />
  
   <input
          type="text"
          name="age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
     <br />     <br />
    Geschlecht
<br />
     <input
          type="text"
          name="sex"
          value={sex}
          onChange={(e) => setSex(e.target.value)}
        />
     <br />     <br />

  Aktueller Wohnort / Land: 
     <br />    

     <input
          type="text"
          name="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
     <br />     <br />  <br />
 
  
                <label>
                    <b>1. Welches Haupt-Problem willst du lösen?</b><br />
                    <input type="text" name="problem" required />
                </label>
                <br /><br />
                
                <label>
                    <b>2. Welche Lösung siehst Du dafür?</b><br />
                    <input type="text" name="solution" required />
                </label>
                <br /><br />
                
                <label>
                    <b>3. In welchem Zeitraum willst Du das Ergebnis fertig haben - in Monaten?</b><br />
                    <input type="number" name="period" min="1" required />
                </label>
                <br /><br />
                
                <label>
                    <b>4. Welche Art von Ergebnis erwartest Du?</b><br />
                    <em>(z.B. Prototyp, fertiges Endprodukt)</em><br />
                    <input type="text" name="result" required />
                </label>
                <br /><br />

                <label>
                    <b>5. Wann ist der Projekt Start?</b><br />
                    <em>(Format: YYYY-MM-DD, z.B. 2025-06-22)</em><br />
                    <input type="date" name="startDate" required />
                </label>
                <br /><br />

                <label>
                    <b>6. Wann fängst Du täglich an zu arbeiten?</b><br />
                    <em>(Format: HH:MM, z.B. 09:00)</em><br />
                    <input type="time" name="dailyStartTime" required />
                </label>
                <br /><br />
                
                <label>
                    <b>7. Wieviel Stunden wirst Du täglich an dem Projekt arbeiten?</b><br />
                    <input type="number" name="dailyHours" min="1" max="12" required />
                </label>
                <br /><br />
                
                <label>
                    <b>8. Wie würdest Du Deine Nische oder Industrie bezeichnen?</b><br />
                    <em>(z.B. Online, Warenverkauf, Dienstleistung)</em><br />
                    <input type="text" name="industry" required />
                </label>
                <br /><br />
   <br />  

   

     <br /> <br />
     <button className="button" type="submit">
             Projektdaten speichern
        </button>
        
 </form>
 {gesamtPrompt}
        </div>
    )
}
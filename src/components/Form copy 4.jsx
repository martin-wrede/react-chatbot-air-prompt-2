import React, {useState, useContext} from "react";
import { Context } from '../Context';
// import data from "./form-texts.json";// Import the JSON file
 // import data from "./data-de-ai.json";

export default function Form(props){
      const  [ age , setAge ] = useState(20)
      const [sex, setSex] =  useState("männlich")
      const [country, setCountry ] = useState("Deutschland")
        const { data } = useContext(Context);
  
      const [promptInfo, setPromptInfo] = useState({
           
        problem: "",
        solution: "",
        result: "",
        period: "", 
        startDate: "", 
        dailyStartTime: "", 
        dailyHours: "", 
        workDays: "",
        industry: ""
    }
    )

      const [gesamtPrompt, setGesamtPrompt] = useState("")
        

const handleSubmit = (event) => {
  event.preventDefault();

  const data = new data(event.target);

  setPromptInfo({
  problem: data.get("problem"),
    solution: data.get("solution"),
    result: data.get("result"),
    period: data.get("period"),
    startDate: data.get("startDate"),
    dailyStartTime: data.get("dailyStartTime"),
    dailyHours: data.get("dailyHours"),
    industry: data.get("industry"),
  });

  let AIRole = data.aiRolePrompt;

  let prompt = data.promptTemplate.problem + data.get("problem")
   + data.promptTemplate.solution + data.get("solution")
   + data.promptTemplate.result + data.get("result")
   + data.promptTemplate.period + data.get("period")
   + data.promptTemplate.startDate + data.get("startDate")
   + data.promptTemplate.dailyStartTime + data.get("dailyStartTime")
   + data.promptTemplate.dailyHours + data.get("dailyHours")
    + data.promptTemplate.dailyHours + data.get("workDays")       
   + data.promptTemplate.industry + data.get("industry");

  const fullPrompt = AIRole + "\n\n" + prompt;

  console.log(fullPrompt);

  props.onPromptChange(fullPrompt);
};

   
    return(
        <div>
            {data.personalDataLabel}
     <br />     <br />

 <form onSubmit={handleSubmit}>
    
{data.ageLabel}
<br />
  
   <input
          type="text"
          name="age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
     <br />     <br />
    {data.genderLabel}
<br />
     <input
          type="text"
          name="sex"
          value={sex}
          onChange={(e) => setSex(e.target.value)}
        />
     <br />     <br />

  {data.countryLabel}
     <br />    

     <input
          type="text"
          name="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
     <br />     <br />  <br />
 
  
                <label>
                    <b>{data.question1}</b><br />
                    <input type="text" name="problem" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{data.question2}</b><br />
                    <input type="text" name="solution" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{data.question3}</b><br />
                    <input type="number" name="period" min="1" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{data.question4}</b><br />
                    <em>{data.question4Hint}</em><br />
                    <input type="text" name="result" required />
                </label>
                <br /><br />

                <label>
                    <b>{data.question5}</b><br />
                    <em>{data.question5Hint}</em><br />
                    <input type="date" name="startDate" required />
                </label>
                <br /><br />

                <label>
                    <b>{data.question6}</b><br />
                    <em>{data.question6Hint}</em><br />
                    <input type="time" name="dailyStartTime" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{data.question7}</b><br />
                    <input type="number" name="dailyHours" min="1" max="12" required />
                </label>
                <br /><br />

                   <label>
                    <b>{data.question8}</b><br />
                    <input type="text" name="workDays" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{data.question9}</b><br />
                    <em>{data.question9Hint}</em><br />
                    <input type="text" name="industry" required />
                </label>
                <br /><br />
   <br />  

   

     <br /> <br />
     <button className="button" type="submit">
             {data.submitButton}
        </button>
        
 </form>
 {gesamtPrompt}
        </div>
    )
}
import React, {useState, useContext} from "react";
import {Context} from "../Context";
import formTexts from "./form-texts.json";// Import the JSON file

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
     //  const { data } = useContext(Context);

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

  let AIRole = formTexts.aiRolePrompt;

  let prompt = formTexts.promptTemplate.problem + formData.get("problem")
   + formTexts.promptTemplate.solution + formData.get("solution")
   + formTexts.promptTemplate.result + formData.get("result")
   + formTexts.promptTemplate.period + formData.get("period")
   + formTexts.promptTemplate.startDate + formData.get("startDate")
   + formTexts.promptTemplate.dailyStartTime + formData.get("dailyStartTime")
   + formTexts.promptTemplate.dailyHours + formData.get("dailyHours")
   + formTexts.promptTemplate.industry + formData.get("industry");

  const fullPrompt = AIRole + "\n\n" + prompt;

  console.log(fullPrompt);

  props.onPromptChange(fullPrompt);
};

   
    return(
        <div>
            {formTexts.personalDataLabel}
     <br />     <br />

 <form onSubmit={handleSubmit}>
    
{formTexts.ageLabel}
<br />
  
   <input
          type="text"
          name="age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
     <br />     <br />
    {formTexts.genderLabel}
<br />
     <input
          type="text"
          name="sex"
          value={sex}
          onChange={(e) => setSex(e.target.value)}
        />
     <br />     <br />

  {formTexts.countryLabel}
     <br />    

     <input
          type="text"
          name="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
     <br />     <br />  <br />
 
  
                <label>
                    <b>{formTexts.question1}</b><br />
                    <input type="text" name="problem" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{formTexts.question2}</b><br />
                    <input type="text" name="solution" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{formTexts.question3}</b><br />
                    <input type="number" name="period" min="1" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{formTexts.question4}</b><br />
                    <em>{formTexts.question4Hint}</em><br />
                    <input type="text" name="result" required />
                </label>
                <br /><br />

                <label>
                    <b>{formTexts.question5}</b><br />
                    <em>{formTexts.question5Hint}</em><br />
                    <input type="date" name="startDate" required />
                </label>
                <br /><br />

                <label>
                    <b>{formTexts.question6}</b><br />
                    <em>{formTexts.question6Hint}</em><br />
                    <input type="time" name="dailyStartTime" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{formTexts.question7}</b><br />
                    <input type="number" name="dailyHours" min="1" max="12" required />
                </label>
                <br /><br />
                
                <label>
                    <b>{formTexts.question8}</b><br />
                    <em>{formTexts.question8Hint}</em><br />
                    <input type="text" name="industry" required />
                </label>
                <br /><br />
   <br />  

   

     <br /> <br />
     <button className="button" type="submit">
             {formTexts.submitButton}
        </button>
        
 </form>
 {gesamtPrompt}
        </div>
    )
}
import {  IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton,IonRow, IonLabel} from '@ionic/react';
import { useState } from 'react';
import './Home.css';

const Home: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState(""); // Yanıtı saklamak için bir state oluşturun

  function istekGonder(text: string): void {
    const myHeaders: Headers = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw: string = JSON.stringify({
      "text": text
    });

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    fetch("http://localhost:3000/api/model", requestOptions)
      .then((response: Response) => response.json()) // Yanıtı JSON olarak çözümle
      .then((result: any) => {
        setResponse(result.text); // Yanıtı state'e kaydedin
      })
      .catch((error: Error) => console.log('error', error));
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Demoai</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonRow className='center-content'>
        <IonInput  value={inputText} onIonChange={(e) => setInputText(e.detail.value!)} placeholder="Enter text"></IonInput>
        <IonButton  onClick={() => istekGonder(inputText)}>Send Request</IonButton>
        <IonLabel>{response}</IonLabel>
      </IonRow>
    </IonPage>
  );
};

export default Home;

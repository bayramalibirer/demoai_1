import { IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton, IonRow, IonLabel } from '@ionic/react';
import { useState } from 'react';
import './Home.css';

const Home: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState(""); // Yanıtı saklamak için bir state oluşturun

  function findPositiveValueAndIndex(arr: number[]): { value: number, index: number } | null {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] > 0) {
        if (arr[i] < 0.5) {
          return { value: arr[i], index: 6 };
        }
        return { value: arr[i], index: i };
      }
    }
    return null;
  }
  function findemotion(index: number): string {
    switch (index) {
      case 0:
        return "Öfkeli";
      case 1:
        return "İğrenme";
      case 2:
        return "Korku";
      case 3:
        return "Mutlu";
      case 4:
        return "Üzgün";
      case 5:
        return "Şaşkın";
      case 6:
        return "Nötr";
      default:
        return "Bilinmiyor";
    }
  }

  async function istekGonder(text: string): Promise<any> {
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
    const response: Response = await fetch("http://localhost:3000/api/model", requestOptions);
    if (!response.ok) {
      console.error('HTTP error', response.status);
    } else {
      try {
        const res: any = await response.json(); // Yanıtı JSON olarak çözümle
        console.log(res);
        const result = findPositiveValueAndIndex(res);
        setResponse(result ? `Duygu: ${findemotion(result.index)}, Score: ${Math.round(10 * result.value)}%` : "No positive value found");
      } catch (error) {
        console.error('Error parsing JSON', error);
      }
    }

  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Demoai</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonRow className='center-content'>
        <IonInput value={inputText} onIonChange={(e) => setInputText(e.detail.value!)} placeholder="Enter text"></IonInput>
        <IonButton onClick={async () => await istekGonder(inputText)}>Send Request</IonButton>
        <IonLabel>{response}</IonLabel>
      </IonRow>
    </IonPage>
  );
};

export default Home;

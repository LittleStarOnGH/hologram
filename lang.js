// คลังคำแปลรวมทุกภาษา (English UK, Thai, Italian, Japanese, Chinese Mandarin)
const webTranslations = {
    en: {
        title: "Hologram Project",
        faculty: "SCHOOL OF ENGINEERING MATHEMATICS AND PHYSICS",
        select_below: "PLEASE SELECT BELOW",
        course_info: "Course Information",
        display_btn: "Display the Hologram",
        guest_btn: "Guest Control",
        credits_btn: "Credits",
        placeholder_code: "Enter 4-digit code"
    },

    it: {
        title: "Progetto Hologram",
        faculty: "SCUOLA DI INGEGNERIA MATEMATICA E FISICA",
        select_below: "SI PREGA DI SELEZIONARE SOTTO",
        course_info: "Informazioni sul Corso",
        display_btn: "Mostra l'Ologramma",
        guest_btn: "Controllo Ospite",
        credits_btn: "Crediti",
        placeholder_code: "Inserisci codice a 4 cifre"
    },
  
  
};

// ฟังก์ชันสำหรับสั่งสลับภาษาบนหน้าจอ
function Change_Language(lang) {
    const elements = document.querySelectorAll('[data-lang]');
    
    elements.forEach((element) => {
        const key = element.getAttribute('data-lang');
        
        if (webTranslations[lang] && webTranslations[lang][key]) {
            // ตรวจสอบว่าเป็นช่อง Input หรือไม่ ถ้าใช่ต้องเปลี่ยนที่ placeholder
            if (element.tagName === 'INPUT') {
                element.placeholder = webTranslations[lang][key];
            } else {
                element.innerText = webTranslations[lang][key];
            }
        }
    });
    
    console.log("Language changed to: " + lang);
}
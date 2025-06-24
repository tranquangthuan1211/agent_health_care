
class AppointmentFunction{
    async createAppointment(){
        try {
            const response = await fetch('http://localhost:8080/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patientId: 1,
                    doctorId: 1,
                    appointment_date: "2025-06-20"
                })
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log('Response data:', data);
            return data;
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw new Error('Internal server error');
        }
    }  
}
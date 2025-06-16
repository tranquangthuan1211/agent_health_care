
class DoctorFunction {
    async getDoctor(){
        try {
            const response = await fetch('http://localhost:8080/api/doctors', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log('Response data:', data);
            return data;
        } catch (error) {
            console.error('Error fetching doctor data:', error);
            throw new Error('Internal server error');
        }
    }
  
}
export default new DoctorFunction();
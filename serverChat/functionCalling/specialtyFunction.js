

class SpecialtyFunction {
  async getSpecialty(){
    try {
      const response = await fetch('http://localhost:8080/api/specialties', {
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
      console.error('Error fetching specialty data:', error);
      throw new Error('Internal server error');
    }
  }
}

export default new SpecialtyFunction();
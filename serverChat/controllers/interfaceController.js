
class InterfaceController {
  async index(req, res) {
    res.sendFile('/public/index.html', { root: '.' });
  }
}
export default new InterfaceController();
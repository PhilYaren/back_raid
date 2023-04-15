export function setUser(socket: any, user: any) {
  socket.request.session.user = user;
}

class UserDto {
    id;
    phone;
    activated;
    createdAt;
    constructor(user) {
        this.id = user.id;
        this.phone = user.phone;
        this.activated = user.activated;
        this.createdAt = user.created_at;
    }
}

export default UserDto;
/*
필수, 추가 기능: DB snake_case ↔ JS camelCase 변환(fromRow), 
SET 문자열('ENGINEER,SQLD') ↔ 배열 변환, 
공개 프로필에서 email·passwordHash 제외
*/

// 아래 방식을 sequelize 방식에서 mysql2/primise방식으로 변경해야함. 

// // 모델 호출
// const {DataTypes} = require("sequelize");   // 기본적으로 connection pool로 관리. createPool도 내부적으로 하고있다.
// const sequelize = require("../config/database");

// const User = sequelize.define(  //DB의 'users' 테이블 구조를 JS 객체 형태로 
//     "users",    // Sequelize 모델 이름. 다른 Sequelize 와 (1:N)관계를 맺을 때 사용. 구분하기 편하게 DB와 이름을 맞췄다.
//     {
//         id: {
//             type: DataTypes.BIGINT,
//             primaryKey: true,
//             autoIncrement: true,
//             allowNull: false,   // PK 에는 필요하지 않지만, 가독성을 위해 추가함
//         },
//         email: {
//             type: DataTypes.STRING(100),
//             unique: true,
//             allowNull: false,
//         },
//         nickname: {
//             type: DataTypes.STRING(30),
//             unique: true,
//             allowNull: false,
//         },
//         password_hash: {
//             type: DataTypes.STRING(255),
//             allowNull: false,
//         },
//         role: {
//             type: DataTypes.ENUM('USER','ADMIN'),
//             allowNull: false,
//             defaultValue: 'USER',
//         },
//         status: {
//             type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
//             defaultValue: 'ACTIVE',
//             allowNull: false,
//         },
//         createdAt: {
//             type: DataTypes.DATE,
//             allowNull: false,
//             field: "created_at" // 생성일("created_at")을 적는 기능. 필드가 없어도 괜찮다고하나 가독성 위해 남김
//         },
//         updatedAt: {
//             type: DataTypes.DATE,
//             allowNull: false,
//             field: "updated_at", // 수정일("updated_at")을 적는 기능. 필드가 없어도 괜찮다고하나 가독성 위해 남김
//         },
//         updatedAt: {
//         },
//     },
//     {
//         tableName: "users",
//         timestamps: true,   // createAt과 updatedAt에 필요하지않을까?
//         underscored: true,  // (js의) camelCase 표기법을 자동으로 snake_case표기법으로 바꿔준다.
//     }
// );

// module.exports = User;
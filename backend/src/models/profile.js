// 모델 호출
const {DataTypes} = require("sequelize");   // 기본적으로 connection pool로 관리. createPool도 내부적으로 하고있다.
const sequelize = require("../config/db");

const Profile = sequelize.define(  //DB의 'users' 테이블 구조를 JS 객체 형태로
    "profile",    // Sequelize 모델 이름. 다른 Sequelize 와 (1:N)관계를 맺을 때 사용. 구분하기 편하게 DB와 이름을 맞췄다.
    {
        intro: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        collaborationMode: {
            type: DataTypes.ENUM('ONLINE','OFFLINE','ANY'),
            allowNull: false,
        },
        activeTimes: {  // NOT NULL 인데 default가 없기때문에, 유효성 검증에서 조심해야할 것 같다
            type: DataTypes.SET(
                // (DAY는 뭔가 더 활기찰 것 같고, AM은 좀 나른할 것 같았나..?)
                                'WEEKDAY_DAY',  
                                'WEEKDAY_NIGHT',
                                'WEEKEND_AM',
                                'WEEKEND_PM'
                            ),
            allowNull: false,
        },
        lookingForTeam: {   // false (==0) 이면 추천 안되는 상태
            type: DataTypes.BOOLEAN,
            defaultValue: true, // (==1)
            allowNull: false,
        },
        portfolioUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    },
    {
        tableName: "users", // DB의 테이블
        timestamps: false,   // createAt과 updatedAt에 필요하지않을까?
        underscored: true,  // (js의) camelCase 표기법을 자동으로 snake_case표기법으로 바꿔준다.
    }
);

module.exports = Profile;
const questionService = require("../services/questionService");



async function list(req, res, next) {
  try {
    const data = await questionService.list(req.query);
    res.status(200).json({
      success: true,
      data,
      message: null
    });
  } catch (error) {
    next(error);
  }
}
// 질문을 등록하고 생성된 질문 번호를 응답하는 함수이다.
async function create(req, res, next) {
  try {
    // 인증 미들웨어가 확인한 사용자 정보이다.
    const actor = req.user;

    const data = await questionService.create(
        actor,
        req.body
    );

    res.status(201).json({
      success: true,
      data,
      message: null
    });
  } catch (error) {
    next(error);
  }
}

// 질문 상세 조회 결과를 응답하는 함수이다.
async function detail(req, res, next) {
  try {
    // 인증 미들웨어가 확인한 사용자 정보이다.
    const actor = req.user;
    const id = req.params.id;

    const data = await questionService.detail(
        actor,
        id
    );

    res.status(200).json({
      success: true,
      data,
      message: null
    });
  } catch (error) {
    next(error);
  }
}

// 질문 수정 결과를 공통 응답 형식으로 반환하는 함수이다.
async function edit(req, res, next) {
  try {
    const data = await questionService.edit(
        req.user,
        req.params.id,
        req.body
    );

    res.status(200).json({
      success: true,
      data,
      message: null
    });
  } catch (error) {
    next(error);
  }
}


// 질문 삭제 결과도 본문이 있는 공통 성공 응답으로 반환하는 함수이다.
async function remove(req, res, next) {
  try {
    const data = await questionService.remove(
      req.user,
      req.params.id
    );

    res.status(200).json({
      success: true,
      data,
      message: null
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create,
  detail,
  edit,
  remove
};

import { Injectable } from '@angular/core';
import { IndexedDbService } from './indexed-db.service';
export class QuizQuestion {
  constructor(
    public id: string,
    public question: string,
    public answer: string
  ) {}
  static parseJson(value: any) {
    return new QuizQuestion(value.id, value.question, value.answer);
  }
  static createNew(question: string, answer: string) {
    return new QuizQuestion(crypto.randomUUID(), question, answer);
  }
}
@Injectable({
  providedIn: 'root',
})
export class QuizManagerService {
  questionIndex: Set<string>;
  questions: QuizQuestion[];
  constructor(private indexedDb: IndexedDbService) {
    try {
      this.loadQuestionIndex();
      this.loadQuestions(this.questionIndex);
    } catch (err) {
      console.error(err);
    }
  }
  async loadQuestionIndex() {
    this.questionIndex = new Set(
      (await this.indexedDb.getItem('index')).split(',')
    );
  }
  removeQuestion(id: string) {
    this.questionIndex.delete(id);
    this.indexedDb.removeItem(id);
    this.saveQuestionIndex();
  }
  saveQuestionIndex() {
    this.indexedDb.setItem('index', [...this.questionIndex].join(','));
  }
  loadQuestions(questionIndex: Set<string>) {
    if (!questionIndex) {
      this.questions = null;
      throw new Error('No index supplied');
    }
    Promise.all([...questionIndex].map(async (q) =>
      QuizQuestion.parseJson(JSON.parse(await this.indexedDb.getItem(q)))
    )).then(resolvedQuestions => {
      this.questions = resolvedQuestions;
    });
  }
  saveQuestion(question: QuizQuestion) {
    if (question == null || question.id == null)
      throw new Error('invalid question saved');
    this.indexedDb.setItem(question.id, JSON.stringify(question));
    this.questionIndex ||= new Set();
    this.questionIndex.add(question.id);
    this.saveQuestionIndex();
  }
}

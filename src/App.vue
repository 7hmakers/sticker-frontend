<script setup lang="ts">
import { breakpointsTailwind } from "@vueuse/core";
import VueCropper from "vue-cropperjs";
import "cropperjs/dist/cropper.css";
import type { FormInstance, FormRules, UploadFile, UploadInstance, UploadProps, UploadRawFile, UploadUserFile } from "element-plus";
import { ElMessage, genFileId } from "element-plus";
import "element-plus/es/components/message/style/css";
import { pinyin } from "pinyin-pro";

import { base64ToFile, fileToBuffer } from "./utils";

enum STYLES {
  A = "2A - 控制中心身份卡",
  B = "2B - 领航员空间站身份卡",
  C = "2C - 地下城居民身份证",
}

const formInstance = ref<FormInstance | null>(null);
const cropperRef = ref();
const cropperVisible = ref(false);
const isUploading = ref(false);

const birthData = reactive({
  year: "",
  month: "",
  day: "",
});

const params = useUrlSearchParams("history");
const hasParamKey = !!params.key;
const key = ref(params.key as string);
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual("md");
const birth = computed(() => `${birthData.year}.${birthData.month}.${birthData.day}`);

const form = reactive({
  style: undefined as "A" | "B" | "C" | undefined,
  name: "",
  pinyin: "",
  uid: "",
  birth,
});

watch(() => form.uid, (val) => {
  if (val) {
    form.uid = val.toUpperCase();
  }
});

const isStyleC = computed(() => form.style === "C");

const imageList = ref<UploadUserFile[]>([]);
const imageUrl = ref("") as Ref<any>;

const UID_PATTERN = /^[A-Z0-9\-]{25}$/;
const BIRTH_PATTERN = /^[0-9]{4}\.[0-9]{2}\.[0-9]{2}$/;
const DOTDOT = "..";

const rules = reactive<FormRules>({
  uid: {
    pattern: UID_PATTERN,
    message: "25位，可包含大写字母、数字或\"-\"",
    trigger: "change",
  },
  birth: {
    message: "格式为YYYY.MM.DD",
    trigger: "change",
    validator: (_, data) => {
      return data === DOTDOT || BIRTH_PATTERN.test(data);
    },
  },
});

const isPinyinModified = ref(false);

const uploadRef = ref<UploadInstance>();

const onExceed: UploadProps["onExceed"] = (files) => {
  uploadRef.value!.clearFiles();
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadRef.value!.handleStart(file);
};

const onChange = async (file: UploadFile) => {
  cropperVisible.value = true;
  await nextTick();
  const result = await fileToBuffer(file.raw!);
  imageUrl.value = result;
  cropperRef.value.replace(result);
};

const onCancelUpload = () => {
  imageList.value = [];
  cropperVisible.value = false;
};

const onInputName = () => {
  if (!isPinyinModified.value) {
    form.pinyin = pinyin(form.name, {
      mode: "surname",
      toneType: "none",
      nonZh: "consecutive",
      v: true,
    }).toUpperCase();
  }
};

const onCrop = () => {
  const file = base64ToFile(cropperRef.value.getCroppedCanvas().toDataURL()) as any as UploadFile;
  file.uid = genFileId();
  (imageList.value[0].raw as any) = file;
  cropperVisible.value = false;
};

const onPinyinModified = () => {
  isPinyinModified.value = true;
};

const isFormValid = () => {
  return new Promise((resolve) => {
    formInstance.value!.validate((valid) => {
      resolve(valid);
    });
  });
};

const validate = async () => {
  const valid = await isFormValid() && form.name && form.pinyin;
  if (!valid) {
    ElMessage.error("请填写完整信息");
  }
  return valid;
};

const uploadImage = async () => {
  const formData = new FormData();
  const image = imageList.value?.[0]?.raw;
  if (image) {
    formData.append("file", image);
  }
  const resp = await fetch(`${import.meta.env.VITE_API_URL}upload_image?key=${key.value}`, {
    method: "POST",
    body: formData,
  }).then(r => r.json());
  return resp;
};

const onSubmit = async () => {
  if (!await validate()) {
    return;
  }
  isUploading.value = true;
  let filename: string | undefined;
  if (isStyleC.value) {
    const imageResp = await uploadImage();
    if (!imageResp.success && imageResp.message !== "file already exist") {
      ElMessage.error(imageResp.message);
    }
    filename = imageResp.filename;
  }
  const uid = !form.uid ? undefined : form.uid;
  const birth = form.birth === DOTDOT ? undefined : form.birth;
  const resp = await fetch(`${import.meta.env.VITE_API_URL}sticker_submit`, {
    method: "POST",
    body: JSON.stringify({
      key: key.value,
      style: form.style,
      name: form.name,
      pinyin: form.pinyin,
      uid,
      birth,
      photo_filename: filename,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(r => r.json());
  isUploading.value = false;
  if (resp.success) {
    ElMessage.success("提交成功");
  } else { ElMessage.error(resp.message); }
};
</script>

<template>
  <main class="flex flex-col items-center justify-center min-h-full p-5">
    <ElCard class="md:w-130 w-full">
      <ElAlert
        class="mb-3!"
        :closable="false"
        show-icon
        type="info"
      >
        <p>注：可以不用填写个人真实信息（</p>
        <p>兑换码只能使用一次</p>
      </ElAlert>
      <ElForm
        ref="formInstance"
        :disabled="isUploading"
        label-width="90px"
        :model="form"
        :rules="rules"
      >
        <ElFormItem label="兑换码" required>
          <ElInput v-model="key" :disabled="hasParamKey" />
        </ElFormItem>
        <ElFormItem label="样式" required>
          <ElSelect
            v-model="form.style"
            class="w-full"
            placeholder="选择样式"
          >
            <ElOption
              v-for="(name, styleKey) in STYLES"
              :key="styleKey"
              :label="name"
              :value="styleKey"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="姓名" required>
          <ElInput v-model="form.name" clearable @input="onInputName" />
        </ElFormItem>
        <ElFormItem label="拼音" required>
          <ElInput v-model="form.pinyin" clearable @input="onPinyinModified" />
        </ElFormItem>
        <ElFormItem label="UID号" prop="uid">
          <ElInput v-model="form.uid" clearable placeholder="留空默认随机" />
        </ElFormItem>
        <ElFormItem v-if="isStyleC" label="出生日期" prop="birth">
          <div class="flex gap-2">
            <ElInput v-model="birthData.year" placeholder="年（四位数字）" />.
            <ElInput v-model="birthData.month" placeholder="月（二位数字）" />.
            <ElInput v-model="birthData.day" placeholder="日（二位数字）" />
          </div>
        </ElFormItem>
        <!-- eslint-disable vue/no-v-model-argument -->
        <ElUpload
          v-if="isStyleC"
          v-model:file-list="imageList"
          ref="uploadRef"
          accept="image/png,image/jpeg"
          :auto-upload="false"
          drag
          :limit="1"
          :multiple="false"
          @change="onChange"
          @exceed="onExceed"
        >
          <ElIcon class="el-icon--upload">
            <span class="i-carbon:add-filled" />
          </ElIcon>
          <div class="el-upload__text">
            拖拽文件到此处，或<em>点击上传</em>
          </div>
        </ElUpload>
        <div class="flex justify-between">
          <div />
          <ElButton type="primary" @click="onSubmit">
            提交
          </ElButton>
        </div>
      </ElForm>
      <ElDialog
        v-model="cropperVisible"
        align-center
        :fullscreen="isMobile"
        :show-close="false"
        title="裁剪"
      >
        <VueCropper
          ref="cropperRef"
          alt="裁剪"
          :aspect-ratio="19.32 / 23.59"
          :src="imageUrl"
        />
        <template #footer>
          <span class="dialog-footer">
            <ElButton @click="onCancelUpload">取消</ElButton>
            <ElButton type="primary" @click="onCrop">
              确认
            </ElButton>
          </span>
        </template>
      </ElDialog>
    </ElCard>
  </main>
</template>
